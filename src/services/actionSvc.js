const _ = require('lodash');
const { SpaceService } = require('./spaceSvc');
const spaceSvc = SpaceService.getInstance()
// const { NotificationHelper } = require('../helper/notificationHelper');
const { NotificationType } = require('../types');
const mongoose = require('mongoose')
const cError = require('../helper/customError')
const { Map } = require('immutable')
const Sharing = mongoose.model('Sharing')
const Form = mongoose.model('Form')
const File = mongoose.model('File')
const UserModel = mongoose.model('User')
const emailSvc = require('./emailSvc')
const userSvc = require('./userSvc')
const fileSvc = require('./fileSvc')
const historySvc = require('./historySvc')
const formHistorySvc = require('./formHistorySvc')
const templateSvc = require('./templateSvc')
const constants = require('../constants')
const AccessModel = mongoose.model('Access')

const actionToResponse = async (USID, form) => {
  const remoteAccess = form.sharingId ? await AccessModel.getAccessByAccessId(form.sharingId) : null;

  const fileId = _.get(remoteAccess, 'fileId')
  const ownerAccess = fileId ? await AccessModel.findOwner(fileId) : null
  const docId = ownerAccess ? ownerAccess._id : null
  const initiatorDocId = ownerAccess ? ownerAccess._id : null
  const recipientDocId = form.sharingId

  const userIdInit = await spaceSvc.findUserIdByUserSpace({_id: form.initiatorId})
  const userIdReci = await spaceSvc.findUserIdByUserSpace({_id: form.recipientId})

  const userFields = ['name', 'surname', 'email', 'isRegistered']
  const initiatorUser = await UserModel.getUserById(userIdInit)
  const recipientUser = await UserModel.getUserById(userIdReci)

  const isInitiator = USID === String(form.initiatorId)

  const initiator = { ..._.pick(initiatorUser, userFields), id: form.initiatorId }
  const recipient = { ..._.pick(recipientUser, userFields), id: form.recipientId }

  const template = form.templateId ? await templateSvc.getTemplate(form.initiatorId, form.templateId) : null

  const type = form.templateId ? constants.FORM_TYPE.FORM : constants.FORM_TYPE.VERIFICATION

  return {
    ..._.omit(form, ['initiatorId', 'recipientId']),
    type,
    docId,
    initiatorDocId,
    recipientDocId,
    isInitiator,
    initiator,
    recipient,
    template: template ? _.pick(template, ['name', '_id', 'inputs', 'languages']) : null,
  }
}

const createVerificationAccess = async (USID, myAccess, remoteUSID, message, ts, ipAddress, templateId, isVerify, userName) => {
  const formIdForm = mongoose.Types.ObjectId()
  const formIdVerf = mongoose.Types.ObjectId()
  const createNotificationDto = {
    recipientId: remoteUSID,
    initiatorId: USID,
  };
  const versionId = myAccess ? _.get(myAccess, 'versionId') : undefined
  const permission = {
    right: constants.RIGHTS.READ,
    type: isVerify ? constants.RIGHT_TYPE.FORM : constants.RIGHT_TYPE.SHARE,
    ref: isVerify ? formIdVerf : remoteUSID,
    versionId: isVerify ? versionId : undefined
  }
  const options = {
    linkId: formIdVerf,
    formId: [formIdVerf],
    histType: constants.HISTORY_ACTION.actionCreated,
    isVerify,
    linkType: constants.LINK_TYPE.actions,
    permissions: [ permission ],
  }
  const template = templateId ? await templateSvc.getTemplate(USID, templateId) : null
  const remoteUserId = await spaceSvc.findUserIdByUserSpace({_id: remoteUSID, valid: true})
  const remoteUser = await userSvc.getUserById(remoteUserId)
  let formReq, veriReq
  let shareList

  if (templateId) {
    const form = await Form.createForm(formIdForm, 'pending', message, ts, templateId, null, USID, remoteUSID);
    createNotificationDto.formId = form._id;
    createNotificationDto.type = NotificationType.FORM;

    const { NotificationHelper } = require('../helper/notificationHelper');
    await NotificationHelper.notifyUser(createNotificationDto);
    const histOptions = { meta: JSON.stringify(form) }
    formReq = await actionToResponse(USID, form.toObject())
    const formHistory = await formHistorySvc.saveThenStampHistory(
      constants.HISTORY_ACTION.actionCreated,
      ts,
      formReq._id,
      USID,
      ipAddress,
      histOptions
    )
  }

  if (myAccess) {
    // check verification or sharing type of form is not duplicated
    const existingRemoteAccess = await AccessModel.getMyAccessesByFileIds(remoteUSID, myAccess.fileId)
    const alreadyExist = existingRemoteAccess.reduce((state, acc) => {
      const existed = acc.permissions.reduce((state, perm) => {
        const existed = perm.type === permission.type && String(perm.ref)===String(permission.ref)
        return state || existed
      }, false)
      return state || existed
    }, false)

    if (!alreadyExist) {
      const accessRes = await fileSvc.shareFile(USID, myAccess, remoteUSID, ts, ipAddress, options)
      const recipients = await fileSvc.getShareRecipients(accessRes)
      shareList = { type: constants.RIGHT_TYPE.SHARE, recipients }

      if (isVerify) {
        const remoteAccessId = accessRes.accessId
        const form = await Form.createForm(
          formIdVerf,
          constants.FORM_ACTION.pending.text,
          message,
          ts,
          null,
          remoteAccessId,
          USID,
          remoteUSID
        );
        createNotificationDto.formId = form._id;
        createNotificationDto.type = NotificationType.VERIFICATION;
        createNotificationDto.docId = remoteAccessId

        const { NotificationHelper } = require('../helper/notificationHelper');
        await NotificationHelper.notifyUser(createNotificationDto);
        //send email noti
        //await emailSvc.sendEmail(remoteUser.email, 'https:google.com', remoteAccessId, '', '', userName, isVerify);
        const histOptions = { meta: JSON.stringify(form) }
        const history = await historySvc.saveThenStampHistory(
          constants.HISTORY_ACTION.actionCreated,
          ts,
          myAccess.fileId,
          USID,
          remoteAccessId,
          ipAddress,
          remoteUser.email,
          histOptions
        )
        veriReq = await actionToResponse(USID, form.toObject())
      }

    } else {
      if (!formReq) {
        throw new cError.InvalidRequestPayloadException(`User ${remoteUser.email} already has access to the file.`)
      }
    }
  }
  return [formReq, veriReq, shareList ].filter((i) => i)
}

const completeVerification = async (userId, formId, statusU, inputs, ts, ipAddress, notes) => {

  const STATUSES = constants.FORM_ACTION
  if (!statusU) throw new cError.InvalidRequestPayloadException('`status` is not defined in the body')

  const status = new String(statusU).toLowerCase()

  const form = await Form.getFormById(formId)
  if (!form) throw new cError.ResourceNotFoundException(`Form with ID: ${formId} does not exist`)
  let userSpace;
  try{
    userSpace = await spaceSvc.findMyUserSpace({_id: form.recipientId, userId})
  } catch (err) {
    throw new cError.PermissionDeniedException('You are not the in the verification list')
  }
  const user = await userSvc.getUserById(userId)
  const remoteAccessId = form.sharingId
  const access = remoteAccessId ? await AccessModel.getAccessByAccessId(remoteAccessId) : null

  const options = { meta: JSON.stringify(form) }
  const isCompleted = form.status !== STATUSES.pending.text && form.status !== STATUSES.received.text
  if (status === STATUSES.rejected.text || status === STATUSES.accepted.text) {
    const dateFilled = ts
    const dateReceived = form.dateReceived ? form.dateReceived : ts
    const inputsFinal = new Map(inputs.map(({ id, value }) => [id, { value }]))
    const inputsObj = form.templateId
      ? form.templateId.inputs.map((inputOld) => {
        return { _id: inputOld._id, ...inputsFinal.get(inputOld._id.toString()) }
      })
      : []
    let historyAction = STATUSES[status].historyAction
    if (isCompleted) {
      const answers = form.answers.map((ans) => {
        return {
          _id: ans._id,
          value: ans.value,
        }
      })
      if (_.isEqual(answers, inputsObj)) throw new cError.InvalidStateTransitException(`No changes has been found`)
      if (form.status != status)
        throw new cError.InvalidStateTransitException(`The status of the request cannot be changed`)
      historyAction = constants.HISTORY_ACTION.actionUpdated
    }
    await Form.completeForm(formId, status, inputsObj, dateReceived, dateFilled, notes)
    const accessInit = await AccessModel.getAccess(_.get(access, 'fileId'), form.initiatorId)
    const createNotificationDto = {
      recipientId: form.initiatorId,
      initiatorId: form.recipientId,
      formId,
      type: form.templateId ? NotificationType.FORM_FILLED : NotificationType.VERIFICATION_FILLED,
      docId: _.get(accessInit, '_id')
    };
    const { NotificationHelper } = require('../helper/notificationHelper');
    await NotificationHelper.notifyUser(createNotificationDto);
    if (form.sharingId) {
      let history = await historySvc.saveThenStampHistory(
        historyAction,
        ts,
        _.get(access, 'fileId'),
        form.initiatorId,
        _.get(access, '_id'),
        ipAddress,
        user.email,
        options,
        notes
      )
    } else {
      let formHistory = await formHistorySvc.saveThenStampHistory(
        historyAction,
        ts,
        formId,
        form.initiatorId,
        ipAddress,
        options,
        notes
      )
    }
  } else if (status === STATUSES.received.text && form.status === STATUSES.pending.text) {
    let dateReceived = ts
    await Form.completeForm(formId, status, form.inputs, dateReceived, null, notes)
    if (form.sharingId) {
      let history = await historySvc.saveThenStampHistory(
        constants.HISTORY_ACTION.actionReceived,
        ts,
        _.get(access, 'fileId'),
        form.initiatorId,
        _.get(access, '_id'),
        ipAddress,
        user.email,
        options
      )
    } else {
      let formHistory = await formHistorySvc.saveThenStampHistory(
        constants.HISTORY_ACTION.actionReceived,
        ts,
        formId,
        form.initiatorId,
        ipAddress,
        options
      )
    }
  } else {
    throw new cError.InvalidStateTransitException(`No transition is performed from '${form.status}' to '${status}'`)
  }
  return actionToResponse(String(userSpace._id), (await Form.getFormById(formId)).toObject())
}

const listReceivedForms = async (USID) => {
  const forms = await Form.getFormsByRecipient(USID)
  const formResps = await Promise.all(
    _.sortBy(forms, ['dateCreated']).reverse().map(async (f) => {
      return await actionToResponse(USID, f)
    })
  )
  return formResps
}

const retrieveForm = async (USID, formId) => {
  try {
    const form = await Form.getUserFormById(USID, formId)
    return form
  } catch (err) {
    throw new cError.ResourceNotFoundException(`Form not found`)
  }
}

const retrieveFormToResponse = async (USID, formId) => {
  try {
    const form = await Form.getUserFormById(USID, formId)
    return actionToResponse(USID, form)
  } catch (err) {
    throw new cError.ResourceNotFoundException(`Form not found`)
  }
}

module.exports.completeVerification = completeVerification
module.exports.createVerificationAccess = createVerificationAccess
module.exports.actionToResponse = actionToResponse
module.exports.listReceivedForms = listReceivedForms
module.exports.retrieveForm = retrieveForm
module.exports.retrieveFormToResponse = retrieveFormToResponse
