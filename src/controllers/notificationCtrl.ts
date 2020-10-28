import { NotificationService } from '../services/notificationSvc';
import express = require('express');
import { CreateNotificationDto, MarkReadDto } from '../dto';
import { validate } from 'class-validator';
import { objReplaceKeyName } from '../helper/resMapper.js'
import resMapper from '../helper/resMapper.js'
import { SpaceService } from '../services/spaceSvc';
import _ from 'lodash'
const spaceSvc = SpaceService.getInstance()
const mongoose = require('mongoose')
const User = mongoose.model('User')
const fileSvc = require('../services/fileSvc')
const actionSvc = require('../services/actionSvc')
const errors = require('../helper/errors');


class NotificationController {

    static INSTANCE: NotificationController;
    private notificationService: NotificationService;
    static getInstance(): NotificationController {
        if (!NotificationController.INSTANCE) {
            NotificationController.INSTANCE = new NotificationController();
        }
        return NotificationController.INSTANCE;
    }

    constructor() {
        this.notificationService = NotificationService.getInstance();
    }


    async markRead(req: express.Request, res: express.Response) {
        try {
            const markReadDto = new MarkReadDto({ id: req.params.id });
            const errors = await validate(markReadDto);
            if (errors.length) {
                throw new Error(errors.toString());
            }
            const { userId } = req.body.authed;
            res.json(objReplaceKeyName(await this.notificationService.markRead(markReadDto, userId), '_id', 'id'));
        } catch (err) {
            errors.makeMessage(res, errors.badRequest, err.message);
        }
    }


    async all(req: express.Request, res: express.Response) {
        try {
            const { userId } = req.body.authed;
            const myUserSpaces = await spaceSvc.findUserSpaces({userId})
            const myUSIDs = myUserSpaces.map(us => String(us._id))
            const notifications = await this.notificationService.all(myUSIDs)

            const USIDs = notifications.map(noti => noti.initiatorId)
            const userSpaces = await spaceSvc.fetchUserSpacesByIds_(USIDs)
            const userIds = userSpaces.map(us => us.userId)
            const users = await User.listUserByIds(userIds)
            const notiResp = await Promise.all(notifications.map(async noti => {
                const us = userSpaces.find(us => String(us._id) === String(noti.initiatorId))
                const initiator = users.find(u => String(u._id) === String(us.userId))
                const myUs = myUserSpaces.find(us => String(us.spaceId) === String(noti.spaceId))
                resMapper.removeAllWithKeyName(initiator, ['brand', 'profileType'])// optional, these field should be deleted from DB (user.brand, user.profileType)
                const file = noti.docId ? resMapper.filesView(await fileSvc.retrieveMyAccessById(noti.docId, myUs._id), req.body.authed): undefined
                const form = noti.formId ? await actionSvc.retrieveFormToResponse(myUs._id, noti.formId): undefined
                return {
                    id: _.get(noti, '_id'),
                    isRead: noti.isRead,
                    type: noti.type,
                    doc: file,
                    form,
                    spaceId: noti.spaceId,
                    createdAt: noti.createdAt,
                    initiator
                }
            }))
            res.json(objReplaceKeyName(notiResp, '_id', 'id'));
        } catch (err) {
            console.log('err.stack', err.stack);
            errors.makeMessage(res, errors.badRequest, err.message);
        }
    }

    async createNotification(input: CreateNotificationDto) {
        await this.notificationService.createNotification(input);
    }
}

export const notificationController = NotificationController.getInstance();