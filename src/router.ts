import { extAppController, caseController, connController, notificationController, spaceController, supportArticleController } from './controllers/all';
import { checklistController } from './controllers/checklistCtrl';
import { spaceReqHandler } from './middleware/all';
import { UserSpaceRole, UserSpacePosition } from './types';
const { actionCatch } = require('./middleware/errorHandler')
const controller = require('./controllers')
const fileSvc = require('./services/fileSvc')
const jwt = require('./middleware/jwt')
const router = require('express').Router()
const timeout = require('connect-timeout')
const passport = require('passport')
const errors = require('./helper/errors')

const parseAppAdmin = ({ noReject }: { noReject?: boolean }) => actionCatch(spaceReqHandler.loadAdmin.bind(spaceReqHandler, noReject))
const parseUSID = actionCatch(spaceReqHandler.load.bind(spaceReqHandler))
const matchRole = (roles) => actionCatch(spaceReqHandler.matchRole.bind(spaceReqHandler, roles))
const matchPosition = (position) => actionCatch(spaceReqHandler.matchPosition.bind(spaceReqHandler, position))

/*
Public API endpoints
*/
router.get('/d/:hmac/:sharingId', actionCatch(controller.downloadCtrl.publicDownload))

router.get('/user/is-registered', actionCatch(controller.userCtrl.isRegistered)) // allow frontend to check if user exist in out system with nice UX. Need to take care of privacy from outside to hitting this endpoint
router.post('/user/reset', actionCatch(controller.authCtrl.reset))
router.post('/signup', actionCatch(controller.authCtrl.signup))
router.post('/signin', actionCatch(controller.authCtrl.signin))
router.post('/login', actionCatch(jwt.ssoLogin))
router.post('/auth', actionCatch(controller.authCtrl.extAuthSignIn))
router.post('/ext/users', actionCatch(controller.authCtrl.extAuthCreateUser))

router.use(jwt.checkToken)


/*
API endpoints require JWT check of the user Id & email
*/
router.post('/documents/download-zip', parseUSID, actionCatch(controller.fileCtrl.downloadZip))
router.post(
  '/documents',
  timeout('3600s'),
  parseUSID,
  controller.fileCtrl.multerUpload.single('file'),
  actionCatch(controller.fileCtrl.handleUpload)
)
router.post(
  '/documents/:accessId',
  timeout('3600s'),
  parseUSID,
  controller.fileCtrl.multerUpload.single('file'),
  actionCatch(controller.fileCtrl.handleUploadVersion)
)
router.get('/documents', parseUSID, actionCatch(controller.fileCtrl.listFiles))
router.get('/documents/:accessId', parseUSID, actionCatch(controller.fileCtrl.retrieveFileById))
router.get('/documents/:accessId/versions', parseUSID, actionCatch(controller.fileCtrl.retrieveAllVersions))
router.put('/documents/update-archived', parseUSID, actionCatch(controller.fileCtrl.archiveOrRestore))
router.put('/documents/:accessId', parseUSID, actionCatch(controller.fileCtrl.modifyFileMetaThenResp))

router.post('/folders/create', parseUSID, actionCatch(controller.folderCtrl.createFolder))
router.post('/folders/delete', parseUSID, actionCatch(controller.folderCtrl.deleteFolder))
router.put('/folders/move', parseUSID, actionCatch(controller.folderCtrl.moveOrRename(fileSvc.updateDir)))
router.put('/folders/rename', parseUSID, actionCatch(controller.folderCtrl.moveOrRename(fileSvc.renameDir)))

router.get('/history', parseUSID, actionCatch(controller.historyCtrl.listHistories))
router.get('/history/:accessId', parseUSID, actionCatch(controller.historyCtrl.listHistoriesByFileId))

router.get('/user/info', parseUSID,actionCatch(controller.userCtrl.getUserInfo))
router.get('/user/overview', actionCatch(controller.userCtrl.getUserOverview))
// router.get('/user/recipients', actionCatch(controller.userCtrl.findContact))// deprecating, not used anymore.
router.put('/user/update', actionCatch(controller.userCtrl.updateUser))
router.put('/user/change-password', actionCatch(controller.authCtrl.changePassword))

router.get('/users/list', parseUSID, actionCatch(controller.userCtrl.getUsers))
router.put('/users/user-type', actionCatch(controller.userCtrl.updateUserType))

router.post('/users', parseUSID, actionCatch(controller.userCtrl.inviteUser))
router.post('/users/:userId/reinvite', actionCatch(controller.userCtrl.reinviteUser))
router.delete('/users/:userId', parseUSID, matchRole([UserSpaceRole.ADMIN]), actionCatch(controller.userCtrl.kickUserFromSpace))
router.put('/users/:userId', parseUSID, matchRole([UserSpaceRole.ADMIN]), actionCatch(controller.userCtrl.changeUserSpaceRole))

router.get('/forms', parseUSID, actionCatch(controller.actionCtrl.getReceivedForms))
router.post('/forms', parseUSID, actionCatch(controller.actionCtrl.createVerification))
router.put('/forms/:formId', actionCatch(controller.actionCtrl.completeVerification))

router.get('/forms/:formId/history', parseUSID, actionCatch(controller.formHistoryCtrl.listFormHistoriesByFormId))

router.post('/templates', parseUSID, actionCatch(controller.templateCtrl.createTemplate))
router.get('/templates', parseUSID, actionCatch(controller.templateCtrl.listTemplates))
router.put('/templates/:templateId', parseUSID, actionCatch(controller.templateCtrl.modifyTemplate))
router.delete('/templates/:templateId', parseUSID, actionCatch(controller.templateCtrl.deleteTemplate))

router.post('/widgets', parseUSID, actionCatch(controller.widgetCtrl.createWidget))
router.get('/widgets', parseUSID, actionCatch(controller.widgetCtrl.listWidget))
router.get('/widgets/:widgetId', parseUSID, actionCatch(controller.widgetCtrl.getWidget))
router.put('/widgets/:widgetId', parseUSID, actionCatch(controller.widgetCtrl.modifyWidget))
router.delete('/widgets/:widgetId', parseUSID, actionCatch(controller.widgetCtrl.deleteWidget))

router.post('/settings', actionCatch(controller.settingCtrl.addSetting))
router.get('/settings', actionCatch(controller.settingCtrl.listSettingUserConfig))
router.put('/settings/:settingId', actionCatch(controller.settingCtrl.updateSetting))
router.delete('/settings/:settingId', actionCatch(controller.settingCtrl.deleteSetting))

router.post('/cases/types', parseUSID, matchPosition([UserSpacePosition.MANAGER]), actionCatch(caseController._addCaseType.bind(caseController)))
router.delete('/cases/types/:caseTypeId', parseUSID, matchPosition([UserSpacePosition.MANAGER]), actionCatch(caseController.deleteCaseType.bind(caseController)))
router.get('/cases/types', parseUSID, actionCatch(caseController.getCaseTypes.bind(caseController)))
router.get('/cases', parseUSID, actionCatch(caseController.getMyCases.bind(caseController)))
router.post('/cases', parseUSID, actionCatch(caseController.createCase.bind(caseController)))
router.post('/cases/:caseId/comments', parseUSID, actionCatch(caseController.comment.bind(caseController)))
router.delete('/cases/comments/:commentId', parseUSID, actionCatch(caseController.deleteComment.bind(caseController)))
router.put('/cases/comments/:commentId', parseUSID, actionCatch(caseController.updateComment.bind(caseController)))
router.post('/cases/:caseId/users', parseUSID, actionCatch(caseController.addUser.bind(caseController)))
router.put('/cases/:caseId', parseUSID, actionCatch(caseController.updateCase.bind(caseController)))
router.post(
  '/cases/:caseId/document',
  timeout('3600s'),
  parseUSID,
  controller.fileCtrl.multerUpload.single('file'),
  actionCatch(caseController.uploadCaseFile.bind(caseController))
)
router.post(
  '/cases/:caseId/documents',
  timeout('3600s'),
  parseUSID,
  controller.fileCtrl.multerMultiUploads.array('file', 3),
  actionCatch(caseController.uploadCaseFiles.bind(caseController))
)

/* Notification APIs */
router.get('/notifications', parseUSID, actionCatch(notificationController.all.bind(notificationController)))
router.put('/notifications/:id/markRead', actionCatch(notificationController.markRead.bind(notificationController)))

/* Space APIs */
router.put('/spaces/:spaceId/settings-admin', parseAppAdmin({}), actionCatch(spaceController.adminUpdateSpace.bind(spaceController)))
router.get('/spaces/admin', parseAppAdmin({}), actionCatch(spaceController.getAllSpaces.bind(spaceController)))

router.post('/spaces', actionCatch(spaceController.createSpace.bind(spaceController)))
router.get('/spaces', actionCatch(spaceController.fetchMySpaces.bind(spaceController)))
router.get('/spaces/:spaceId', parseAppAdmin({noReject: true}), actionCatch(spaceController.fetchMySpaceById.bind(spaceController)))
router.post('/spaces/:spaceId/leave', actionCatch(controller.userCtrl.leaveSpace))
router.put('/spaces/:spaceId', parseUSID, matchRole([UserSpaceRole.ADMIN]), actionCatch(spaceController.updateSpaces.bind(spaceController)))
router.get('/spaces/:spaceId/users', parseUSID, matchRole([UserSpaceRole.ADMIN]), actionCatch(spaceController.getRegisteredUsers.bind(spaceController)))
router.get('/spaces/managers/selected', parseUSID, actionCatch(spaceController.getManagers.bind(spaceController)))
router.get('/spaces/:spaceId/managers', parseUSID, matchRole([UserSpaceRole.ADMIN]), actionCatch(spaceController.getManagers.bind(spaceController)))
router.post('/spaces/:spaceId/manager/:managerId', parseUSID, matchRole([UserSpaceRole.ADMIN]), actionCatch(spaceController.addManager.bind(spaceController)))
router.delete('/spaces/:spaceId/manager/:managerId', parseUSID, matchRole([UserSpaceRole.ADMIN]), actionCatch(spaceController.deleteManager.bind(spaceController)))

/* Connection APIs */
router.post('/connections', parseUSID, actionCatch(connController.addConn.bind(connController)))
router.get('/connections', parseUSID, actionCatch(connController.getConn.bind(connController)))
router.delete('/connections/:userId', parseUSID, actionCatch(connController.removeConn.bind(connController)))

/* Document Type APIs */

router.post('/checklist/document-type/:spaceId', parseUSID, matchRole([UserSpaceRole.ADMIN]), actionCatch(checklistController.addDocumentType.bind(checklistController)))
router.get('/checklist/document-type/:spaceId', actionCatch(checklistController.fetchDocumentTypes.bind(checklistController)))
router.delete('/checklist/document-type/:spaceId/:documentTypeId', parseUSID, matchRole([UserSpaceRole.ADMIN]), actionCatch(checklistController.removeDocumentType.bind(checklistController)))

router.get('/checklist', parseUSID, actionCatch(controller.fileCtrl.listChecklistFiles))
router.post(
  '/checklist/:documentType',
  timeout('3600s'),
  parseUSID,
  controller.fileCtrl.multerUpload.single('file'),
  actionCatch(controller.fileCtrl.handleChecklistUpload)
)

router.get('/supports/topics', parseUSID, actionCatch(supportArticleController.getTopics.bind(supportArticleController)))
router.post('/supports/topics', parseUSID,  matchPosition([UserSpacePosition.MANAGER]), actionCatch(supportArticleController.addTopic.bind(supportArticleController)))
router.put('/supports/topics/:topicId', parseUSID,  matchPosition([UserSpacePosition.MANAGER]), actionCatch(supportArticleController.editTopic.bind(supportArticleController)))
router.delete('/supports/topics/:topicId', parseUSID,  matchPosition([UserSpacePosition.MANAGER]), actionCatch(supportArticleController.deleteTopic.bind(supportArticleController)))

router.post('/supports/improvements', parseUSID,  matchPosition([UserSpacePosition.MANAGER]), actionCatch(supportArticleController.addImprovements.bind(supportArticleController)))
router.get('/supports/improvements', parseUSID, actionCatch(supportArticleController.getImprovements.bind(supportArticleController)))
router.put('/supports/improvements/:improvementId', parseUSID,  matchPosition([UserSpacePosition.MANAGER]), actionCatch(supportArticleController.editImprovements.bind(supportArticleController)))
router.delete('/supports/improvements/:improvementId', parseUSID,  matchPosition([UserSpacePosition.MANAGER]), actionCatch(supportArticleController.deleteImprovement.bind(supportArticleController)))

router.post('/supports/articles', parseUSID, matchPosition([UserSpacePosition.MANAGER]), actionCatch(supportArticleController.createArticle.bind(supportArticleController)))
router.get('/supports/articles', parseUSID, actionCatch(supportArticleController.listArticles.bind(supportArticleController)))
router.get('/supports/articles/:articleId', parseUSID, actionCatch(supportArticleController.getArticleById.bind(supportArticleController)))
router.put('/supports/articles/:articleId', parseUSID, matchPosition([UserSpacePosition.MANAGER]), actionCatch(supportArticleController.editArticle.bind(supportArticleController)))
router.delete('/supports/articles/:articleId', parseUSID, matchPosition([UserSpacePosition.MANAGER]), actionCatch(supportArticleController.deleteArticle.bind(supportArticleController)))
router.post('/supports/articles/:articleId/views', parseUSID, actionCatch(supportArticleController.viewInc.bind(supportArticleController)))

router.post('/supports/articles/:articleId/feedback', parseUSID, actionCatch(supportArticleController.createFeedback.bind(supportArticleController)))
router.get('/supports/articles/:articleId/feedback', parseUSID, matchPosition([UserSpacePosition.MANAGER]), actionCatch(supportArticleController.getFeedback.bind(supportArticleController)))

router.post('/ext/apps', parseUSID, matchRole([UserSpaceRole.ADMIN]), actionCatch(extAppController.createExtApp.bind(extAppController)))

router.post(
  '/ext/documents',
  timeout('3600s'),
  parseUSID,
  controller.fileCtrl.multerUpload.single('file'),
  actionCatch(controller.fileCtrl.handleUpload)
)


module.exports = router
