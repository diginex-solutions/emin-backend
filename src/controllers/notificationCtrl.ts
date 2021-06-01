import { NotificationService } from '../services/notificationSvc';
import express = require('express');
import { CreateNotificationDto, MarkReadDto } from '../dto';
import { validate } from 'class-validator';
import { objReplaceKeyName } from '../helper/resMapper.js'
import resMapper from '../helper/resMapper.js'
import { SpaceService } from '../services/spaceSvc';
import _ from 'lodash'
import { NotificationType } from '../types';
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
            const { id } = req.body.decoded;
            res.json(objReplaceKeyName(await this.notificationService.markRead(markReadDto, id), '_id', 'id'));
        } catch (err) {
            errors.makeMessage(res, errors.badRequest, err.message);
        }
    }


    async all(req: express.Request, res: express.Response) {
        try {
            const { id } = req.body.decoded;
            const myUserSpaces = await spaceSvc.findUserSpaces({userId: id})
            const myUSIDs = myUserSpaces.map(us => String(us._id))
            let skip = parseInt(req.query.skip)
            if (!skip) skip = 0
            let limit = parseInt(req.query.limit)
            if (!limit) limit = 5
            //console.log(req.query.skip, req.query.limit)
            //console.log(skip, limit)
            const notifications = await this.notificationService.all(myUSIDs, skip, limit)

            const USIDs = notifications.map(noti => noti.initiatorId)
            const userSpaces = await spaceSvc.fetchUserSpacesByIds_(USIDs)
            const userIds = userSpaces.map(us => us.userId)
            const users = await User.listUserByIds(userIds)
            let notiResp = await Promise.all(notifications.map(async noti => {
                const us = userSpaces.find(us => String(us._id) === String(noti.initiatorId))
                const initiator = users.find(u => String(u._id) === String(us.userId))
                const myUs = myUserSpaces.find(us => String(us.spaceId) === String(noti.spaceId))
                resMapper.removeAllWithKeyName(initiator, ['brand', 'profileType'])// optional, these field should be deleted from DB (user.brand, user.profileType)
                //const file = {}
                //const form = {}
                const file = noti.docId ? resMapper.filesView(await fileSvc.retrieveMyAccessById(noti.docId, myUs._id), req.body.decoded): undefined
                //console.log(noti.docId + ": " + JSON.stringify(file))
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
            //remove duplicate doc.category for 
            if (notiResp.length > 0){
                notiResp = notiResp.reduce((acc, cur)=>{
                    let existed = acc.find(x=> (x.type === NotificationType.VERIFICATION && x.doc && x.doc.category && cur.doc && cur.doc.category && x.doc.category === cur.doc.category));
                    if(existed && existed.createdAt < cur.createdAt){
                        acc.splice(acc.indexOf(existed), 1)
                    }
                    acc.push(cur)
                    return acc
                    }, [])
            }

            res.json(objReplaceKeyName(notiResp, '_id', 'id'));
        } catch (err) {
            console.log('err.stack', err.stack);
            errors.makeMessage(res, errors.badRequest, err.message);
        }
    }

    async countUnRead(req: express.Request, res: express.Response) {
        try {
            const { id } = req.body.decoded;
            const myUserSpaces = await spaceSvc.findUserSpaces({userId: id})
            const myUSIDs = myUserSpaces.map(us => String(us._id))
            //console.log(req.query.skip, req.query.limit)
            //console.log(skip, limit)
            const notifications = await this.notificationService.countUnRead(myUSIDs)

            res.json({number: notifications});
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