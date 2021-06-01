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
const multer = require('multer')
const upload = multer({dest: 'uploads/'})
const memoryUpload = multer({ storage: multer.memoryStorage() })

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
router.post('/signup-with-fb', actionCatch(controller.authCtrl.signupWithFb))
router.post('/signin', actionCatch(controller.authCtrl.signin))
router.post('/signin-with-fb', actionCatch(controller.authCtrl.signinWithFb))
router.post('/login', actionCatch(jwt.ssoLogin))
router.post('/auth', actionCatch(controller.authCtrl.extAuthSignIn))
router.post('/ext/users', actionCatch(controller.authCtrl.extAuthCreateUser))
router.post('/signin-with-apple', actionCatch(controller.authCtrl.signinWithApple))
router.delete('/user/delete/:email', actionCatch(controller.userCtrl.deleteUser))
router.post('/signin-with-line', actionCatch(controller.authCtrl.signinWithLine))
router.post('/login-with-line', actionCatch(controller.authCtrl.loginWithLine))

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
router.get('/user/profile/:userid', parseUSID,actionCatch(controller.userCtrl.getUserById))
router.get('/user/profile-strength-meter', parseUSID,actionCatch(controller.userCtrl.getProfileStrengthMeter))
router.get('/user/get-news-feed', parseUSID, actionCatch(controller.userCtrl.getNewsFeed))
router.get('/user/overview', actionCatch(controller.userCtrl.getUserOverview))
// router.get('/user/recipients', actionCatch(controller.userCtrl.findContact))// deprecating, not used anymore.
router.put('/user/update', actionCatch(controller.userCtrl.updateUser))
router.post('/user/upload-photo', controller.fileCtrl.multerUpload.single('photo'), actionCatch(controller.userCtrl.uploadPhoto))
router.put('/user/add-experience', actionCatch(controller.userCtrl.addExperience))
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

router.post('/cases/types', parseAppAdmin({}), actionCatch(caseController._addCaseType.bind(caseController)))
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
router.get('/notifications/count-un-read', parseUSID, actionCatch(notificationController.countUnRead.bind(notificationController)))
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
router.get('/checklist/count-upload/:type', parseUSID, actionCatch(controller.fileCtrl.countUpload))

router.delete('/checklist/delete-document/:documentId', parseUSID, actionCatch(controller.fileCtrl.deleteDocument))

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

router.get('/elearning/videofilters/:language', actionCatch(controller.videoCtrl.getVideoFilter))
router.put('/elearning/updateViewCount/:videoId', actionCatch(controller.videoCtrl.updateViewCount))
router.post('/elearning/updateWatchStatus/:videoId', actionCatch(controller.videoCtrl.updateWatchStatus))
router.get('/elearning/getPopularVideos', actionCatch(controller.videoCtrl.getPopularVideos))
router.get('/elearning/getRecentVideos', actionCatch(controller.videoCtrl.getRecentVideos))

router.get('/budgetCalculator/getMasterData/:currency', actionCatch(controller.budgetCalculatorCtrl.getAllBudgetCalculator))
router.get('/budgetCalculator/getMasterDataForMigrationCost/:currency', actionCatch(controller.budgetCalculatorCtrl.getMasterDataForMigrationCost))
router.post('/budgetCalculator/insertUserData/:currency', actionCatch(controller.budgetCalculatorCtrl.insertUserBudgetCalculator))
router.get('/budgetCalculator/getUserData', actionCatch(controller.budgetCalculatorCtrl.getAllUserBudgetCalculator))
router.delete('/budgetCalculator/deleteUserData', actionCatch(controller.budgetCalculatorCtrl.deleteUserBudgetCalculator))
router.get('/budgetCalculator/getExchangeRate', actionCatch(controller.budgetCalculatorCtrl.getExchangeRate))
router.post('/budgetCalculator/insertBudgetCalculator', actionCatch(controller.budgetCalculatorCtrl.createNewBudgetCalculator))
router.delete('/budgetCalculator/deleteBudgetCalculator/:Id', actionCatch(controller.budgetCalculatorCtrl.deleteBudgetCalculatorById))
router.post('/budgetCalculator/insertExchangeRate', actionCatch(controller.budgetCalculatorCtrl.createNewExchangeRate))
router.delete('/budgetCalculator/deleteExchangeRate/:Id', actionCatch(controller.budgetCalculatorCtrl.deleteExchangeRateById))

router.get('/videos/getAll', actionCatch(controller.videoCtrl.getAllVideos))
router.delete('/videos/:videoId', actionCatch(controller.videoCtrl.deleteVideo))
router.post('/videos/upsert', actionCatch(controller.videoCtrl.upsertVideo))

router.post('/videofilter/createvideofilter', actionCatch(controller.videoCtrl.createVideoFilter))
router.delete('/videofilter/deletevideofilter/:vidfilterId', actionCatch(controller.videoCtrl.deleteVideoFilter))

router.get('/migrationChecklist', parseUSID, actionCatch(controller.migrationChecklistCtrl.getData))
router.post(
  '/migrationChecklist/:documentType',
  timeout('3600s'),
  parseUSID,
  controller.fileCtrl.multerMultiUploads.array('files', 100),
  actionCatch(controller.migrationChecklistCtrl.uploadFiles)
)
router.delete('/migrationChecklist/delete-file/:fileId', parseUSID, actionCatch(controller.migrationChecklistCtrl.deleteFile))
router.get('/migrationChecklist/view-history/:documentType', parseUSID, actionCatch(controller.migrationChecklistCtrl.getHistory))
router.post('/migrationChecklist/share/:documentType', parseUSID, actionCatch(controller.migrationChecklistCtrl.share))
router.post('/migrationChecklist/verify/:sharingId', parseUSID, actionCatch(controller.migrationChecklistCtrl.verify))
router.get('/migrationChecklist/get-notifications', parseUSID, actionCatch(controller.migrationChecklistCtrl.getNotifications))
router.get('/migrationChecklist/view-detail-notification/:id', parseUSID, actionCatch(controller.migrationChecklistCtrl.viewDetailNotification))
router.get('/migrationChecklist/count-unread-notification', parseUSID, actionCatch(controller.migrationChecklistCtrl.countUnReadNotifications))

router.get('/seabook', parseUSID, actionCatch(controller.seabookCtrl.getData))
router.get('/seabook/getAllChecklistCategory', parseUSID, actionCatch(controller.seabookCtrl.getAllChecklistCategory))
router.get('/seabook/getChecklistCategoryById/:id', parseUSID, actionCatch(controller.seabookCtrl.getChecklistCategoryById))
router.delete('/seabook/deleteChecklistCategory', parseUSID, actionCatch(controller.seabookCtrl.deleteChecklistCategory))
router.get('/seabook/getAllChecklistDocument', parseUSID, actionCatch(controller.seabookCtrl.getAllChecklistDocument))
router.get('/seabook/getChecklistDocumentById/:id', parseUSID, actionCatch(controller.seabookCtrl.getChecklistDocumentById))
router.delete('/seabook/deleteChecklistDocument', parseUSID, actionCatch(controller.seabookCtrl.deleteChecklistDocument))
router.get('/seabook/getAllDocumentPath', parseUSID, actionCatch(controller.seabookCtrl.getAllDocumentPath))
router.get('/seabook/getDocumentPathById/:id', parseUSID, actionCatch(controller.seabookCtrl.getDocumentPathById))
router.delete('/seabook/deleteDocumentPath', parseUSID, actionCatch(controller.seabookCtrl.deleteAllDocumentPath))
router.post('/seabook/createChecklistCategory', actionCatch(controller.seabookCtrl.createChecklistCategory))
router.delete('/seabook/deleteChecklistCategoryById/:id', actionCatch(controller.seabookCtrl.deleteChecklistCategoryById))
router.post('/seabook/createChecklistDocument', actionCatch(controller.seabookCtrl.createChecklistDocument))
router.delete('/seabook/deleteChecklistDocumentById/:id', actionCatch(controller.seabookCtrl.deleteChecklistDocumentById))
router.post('/seabook/createDocumentPath', actionCatch(controller.seabookCtrl.createDocumentPath))
router.delete('/seabook/deleteDocumentPathById/:id', actionCatch(controller.seabookCtrl.deleteDocumentPathById))

router.get('/survey/getAllSurvey', parseUSID, actionCatch(controller.surveyCtrl.getAllSurvey))
router.get('/survey/getSurveyById/:id', parseUSID, actionCatch(controller.surveyCtrl.getSurveyById))
router.delete('/survey/deleteAllSurvey', parseUSID, actionCatch(controller.surveyCtrl.deleteAllSurvey))
router.delete('/survey/deleteSurvey/:id', parseUSID, actionCatch(controller.surveyCtrl.deleteSurvey))
router.post('/survey/createSurvey', parseUSID, actionCatch(controller.surveyCtrl.createSurvey))
router.post('/survey/addPage', parseUSID, actionCatch(controller.surveyCtrl.addPage))
router.delete('/survey/deletePage', parseUSID, actionCatch(controller.surveyCtrl.deletePage))
router.get('/survey/getAnswer', parseUSID, actionCatch(controller.surveyCtrl.getAnswer))
router.get('/survey/getAnswerByControllId', parseUSID, actionCatch(controller.surveyCtrl.getAnswerByControllId))
router.post('/survey/submitAnswer', parseUSID, actionCatch(controller.surveyCtrl.submitAnswer))
router.get('/survey/getUserSurvey', parseUSID, actionCatch(controller.surveyCtrl.getUserSurvey))
router.post('/survey/createSurveyTranslation', parseUSID, actionCatch(controller.surveyCtrl.createSuvreyTranslation))
router.get('/survey/getSurveyTranslationBySurveyId', parseUSID, actionCatch(controller.surveyCtrl.getSurveyTranslationBySurveyId))
router.get('/survey/getAnswerBySurveyTranslationId', parseUSID, actionCatch(controller.surveyCtrl.getAnswerBySurveyTranslationId))

router.get('/dashlet/getBySurvey', parseUSID, actionCatch(controller.dashletCtrl.getBySurvey))
router.post('/dashlet/save', parseUSID, actionCatch(controller.dashletCtrl.saveDashlet))
router.delete('/dashlet/delete/:id', parseUSID, actionCatch(controller.dashletCtrl.deleteDashlet))
router.get('/dashlet/getById/:id', parseUSID, actionCatch(controller.dashletCtrl.getById))
router.get('/user/getByEmail', parseUSID, actionCatch(controller.userCtrl.getUserByEmail))

router.get('/history/getBlockChainHistory/:id', parseUSID, actionCatch(controller.blockChainCrl.getBlockChainHistory))

router.get('/document/getDocumentContact', parseUSID, actionCatch(controller.documentCtrl.getDocumentContact))
router.post('/document/uploadDocument', 
  timeout('3600s'),
  parseUSID,
  controller.fileCtrl.multerMultiUploads.array('file', 100),
  actionCatch(controller.documentCtrl.uploadDocument))
router.post('/document/shareDocument', parseUSID, actionCatch(controller.documentCtrl.shareDocument))
router.get('/document/getDocumentByUser', parseUSID, actionCatch(controller.documentCtrl.getDocumentByUser))
router.delete('/document/deleteDocument/:docId', parseUSID, actionCatch(controller.documentCtrl.deleteDocument))
router.get('/document/getDocumentNoti', parseUSID, actionCatch(controller.documentCtrl.getDocumentNoti))
router.get('/document/getDocumentNotiDetails/:notiId', parseUSID, actionCatch(controller.documentCtrl.getDocumentNotiDetails))
router.post('/document/verifyDocument', parseUSID, actionCatch(controller.documentCtrl.verifyDocument))
router.get('/document/count-unread-notification', parseUSID, actionCatch(controller.documentCtrl.countUnReadNotifications))
router.get('/document/getDocumentContactDetail/:id', parseUSID, actionCatch(controller.documentCtrl.getDocumentContactDetail))
router.get('/document/uploadDataToBlockChain', parseUSID, actionCatch(controller.documentCtrl.uploadDataToBlockChain))

router.post(
  '/export-pdf', 
  timeout('3600s'),
  memoryUpload.array('files', 100),
  actionCatch(controller.userCtrl.exportPdf)
)

module.exports = router
