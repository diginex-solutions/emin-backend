import _ from 'lodash'
import { validate } from 'class-validator';
import express from 'express';
import { SpaceService } from '../services/spaceSvc';
import { SupportArticleService } from '../services/supportArticleSvc';
import { SupportArticle } from '../types';
import { CreateArticleDto, CreateTopicDto, CreateImprovementDto, CreateFeedbackDto } from '../dto';
const spaceSvc = SpaceService.getInstance()
const userSvc = require('../services/userSvc')
const cError = require('../helper/customError')
const resMapper = require('../helper/resMapper.js')

class SupportArticleController {
  static INSTANCE: SupportArticleController;
  private supportArticleService: SupportArticleService;
  static getInstance(): SupportArticleController {
    if (!SupportArticleController.INSTANCE) {
      SupportArticleController.INSTANCE = new SupportArticleController();
    }
    return SupportArticleController.INSTANCE;
  }

  constructor() {
    this.supportArticleService = SupportArticleService.getInstance();
  }

  async editImprovements(req: express.Request, res: express.Response) {
    const { RESERVED_SPACEID } = req.body
    const { improvementId } = req.params
    const editImprovementDto = new CreateImprovementDto(req.body)
    const errors = await validate(editImprovementDto);
    if (errors.length) {
      throw new cError.InvalidRequestPayloadException(errors.toString())
    }
    const improvement = await this.supportArticleService.editImprovements(RESERVED_SPACEID, improvementId, editImprovementDto)
    res.json(resMapper.objReplaceKeyName(improvement, '_id', 'id'))
  }

  async getImprovements(req: express.Request, res: express.Response) {
    const { RESERVED_SPACEID } = req.body
    const improvements = await this.supportArticleService.fetchAllFbImprvs(RESERVED_SPACEID)
    res.json(resMapper.objReplaceKeyName(improvements, '_id', 'id'))
  }

  async addImprovements(req: express.Request, res: express.Response) {
    const { RESERVED_SPACEID } = req.body
    const createImprovementDto = new CreateImprovementDto(req.body)
    const errors = await validate(createImprovementDto);
    if (errors.length) {
      throw new cError.InvalidRequestPayloadException(errors.toString())
    }
    const improvement = await this.supportArticleService.addImprovements(RESERVED_SPACEID, createImprovementDto)
    res.json(resMapper.objReplaceKeyName(improvement, '_id', 'id'))
  }

  async deleteImprovement(req: express.Request, res: express.Response) {
    const { RESERVED_SPACEID } = req.body
    const { improvementId } = req.params
    const improvement = await this.supportArticleService.deleteImprovement(RESERVED_SPACEID, improvementId)
    res.json(resMapper.objReplaceKeyName(improvement, '_id', 'id'))

  }

  async getTopics(req: express.Request, res: express.Response) {
    const { RESERVED_SPACEID } = req.body
    const topics = await this.supportArticleService.fetchAllTopics(RESERVED_SPACEID)
    res.json(resMapper.objReplaceKeyName(topics, '_id', 'id'))
  }

  async addTopic(req: express.Request, res: express.Response) {
    const { RESERVED_SPACEID } = req.body
    const createTopicDto = new CreateTopicDto(req.body)
    const errors = await validate(createTopicDto);
    if (errors.length) {
      throw new cError.InvalidRequestPayloadException(errors.toString())
    }
    const topicRes = await this.supportArticleService.addTopic(RESERVED_SPACEID, createTopicDto)
    res.json(resMapper.objReplaceKeyName(topicRes, '_id', 'id'))
  }

  async editTopic(req: express.Request, res: express.Response) {
    const { RESERVED_SPACEID } = req.body
    const { topicId } = req.params
    const editTopicDto = new CreateTopicDto(req.body)
    const errors = await validate(editTopicDto)
    if (errors.length) {
      throw new cError.InvalidRequestPayloadException(errors.toString())
    }
    const topicRes = await this.supportArticleService.editTopic(RESERVED_SPACEID, topicId, editTopicDto)
    res.json(resMapper.objReplaceKeyName(topicRes, '_id', 'id'))
  }

  async deleteTopic(req: express.Request, res: express.Response) {
    const { RESERVED_SPACEID } = req.body
    const { topicId } = req.params
    const topicRes = await this.supportArticleService.deleteTopic(RESERVED_SPACEID, topicId)
    res.json(resMapper.objReplaceKeyName(topicRes, '_id', 'id'))
  }

  async createArticle(req: express.Request, res: express.Response) {
    const { RESERVED_SPACEID, RESERVED_USID } = req.body
    const createArticleDto = new CreateArticleDto(req.body)
    const errors = await validate(createArticleDto);
    if (errors.length) {
      throw new cError.InvalidRequestPayloadException(errors.toString())
    }
    const art = await this.supportArticleService.newArticle(RESERVED_USID, RESERVED_SPACEID, createArticleDto)
    const article = await this.sanitize(art)
    let topic
    if (createArticleDto.topicId) {
      topic = await this.supportArticleService.getTopic(createArticleDto.topicId)
      if (!topic) {
        throw new cError.ResourceNotFoundException(`Topic not found with Id: ${createArticleDto.topicId}`)
      }
    }
    article.topic = topic?.name
    article.htmlInText = undefined
    res.json(resMapper.objReplaceKeyName(article, '_id', 'id'))
  }

  htmlToSummary(html: string): string {
    const maxLength = 300
    const baseLength = 200
    const regex = /[.?!\n](?=([^"]*"[^"]*")*[^"]*$)/;
    const temp = this.supportArticleService.convertToText(String(html).replace(/&nbsp;|\u00A0|\s/g, ' '), '\n')
    const match = temp.substring(baseLength).match(regex)
    let summary
    if (match && baseLength + match.index < maxLength) {
      summary = temp.substring(0, baseLength + match.index + 1)
    } else {
      summary = temp.substring(0, maxLength)
    }
    summary = summary.length < temp.length ? summary + '...' : summary
    return summary.replace(/(?:\r\n|\r|\n)/g, ' ')
  }

  async sanitize(article: SupportArticle) {
    const obj = JSON.parse(JSON.stringify(article))
    obj.text = JSON.parse(obj.text)
    const userId = await spaceSvc.findUserIdByUserSpace({_id: article.USID})
    const user = await userSvc.getUserById(userId)
    obj.userId = userId
    obj.user = _.pick(user, ["email", "name", "surname"])
    obj.summary = this.htmlToSummary(obj.text)
    return obj
  }

  async getArticleById(req: express.Request, res: express.Response) {
    const { RESERVED_SPACEID } = req.body
    const { articleId } = req.params
    const art = await this.supportArticleService.getArticleById(RESERVED_SPACEID, articleId)
    const article = await this.sanitize(art)
    let topic
    if (article.topicId) {
      topic = await this.supportArticleService.getTopic(article.topicId)
      if (!topic) {
        throw new cError.ResourceNotFoundException(`Topic not found with Id: ${article.topicId}`)
      }
    }
    article.topic = topic?.name
    res.json(resMapper.objReplaceKeyName(article, '_id', 'id'))
  }

  async listArticles(req: express.Request, res: express.Response) {
    const { RESERVED_SPACEID } = req.body
    const { topicId } = req.query
    const topics = await this.supportArticleService.fetchAllTopics(RESERVED_SPACEID)
    let articles
    if (req.query.q) {
      articles = await this.supportArticleService.searchArticles(RESERVED_SPACEID, topicId, req.query.q)
    } else {
      articles = await this.supportArticleService.getArticles(RESERVED_SPACEID, topicId)
    }
    const articlesResp = await Promise.all(articles.map(async art => {
      const article = await this.sanitize(art)
      const topicTitle = topics.find(top => String(top._id) === String(art.topicId))?.name
      return _.assign({}, article, {topic: topicTitle || null})
    }))
    res.json(resMapper.objReplaceKeyName(articlesResp, '_id', 'id'))
  }

  async editArticle(req: express.Request, res: express.Response) {
    const { RESERVED_SPACEID, RESERVED_TIME } = req.body
    const { articleId } = req.params
    const createArticleDto = new CreateArticleDto(req.body)
    const article = await this.supportArticleService.editArticle(RESERVED_SPACEID, articleId, createArticleDto, RESERVED_TIME)
    const topic = await this.supportArticleService.getTopic(article.topicId)
    const topicTitle = topic?.name
    const articleResp = _.assign({}, article, {topic: topicTitle || null})
    res.json(resMapper.objReplaceKeyName(await this.sanitize(articleResp), '_id', 'id'))
  }

  async deleteArticle(req: express.Request, res: express.Response) {
    const { RESERVED_SPACEID } = req.body
    const { articleId } = req.params
    const article = await this.supportArticleService.deleteArticle(RESERVED_SPACEID, articleId)
    const topic = await this.supportArticleService.getTopic(article.topicId)
    const topicTitle = topic?.name
    const articleResp = _.assign({}, article, {topic: topicTitle || null})
    res.json(resMapper.objReplaceKeyName(await this.sanitize(articleResp), '_id', 'id'))
  }

  async viewInc(req: express.Request, res: express.Response) {
    const { RESERVED_SPACEID } = req.body
    const { articleId } = req.params
    const article = await this.supportArticleService.increaseViews(RESERVED_SPACEID, articleId)
    res.json(resMapper.objReplaceKeyName(await this.sanitize(article), '_id', 'id'))
  }

  async createFeedback(req: express.Request, res: express.Response) {
    const { RESERVED_SPACEID, RESERVED_USID } = req.body
    const { articleId } = req.params
    const { userId } = req.body.decoded
    const createFeedbackDto = new CreateFeedbackDto(req.body)
    const errors = await validate(createFeedbackDto);
    if (errors.length) {
      throw new cError.InvalidRequestPayloadException(errors.toString())
    }
    const feedback = await this.supportArticleService.createFeedback(RESERVED_USID, RESERVED_SPACEID, articleId, createFeedbackDto, userId)
    res.json(resMapper.objReplaceKeyName(feedback, '_id', 'id'))
  }

  async getFeedback(req: express.Request, res: express.Response) {
    const { RESERVED_SPACEID, RESERVED_USID } = req.body
    const { articleId } = req.params
    const feedbacks = await this.supportArticleService.getArticleFeedbacks(RESERVED_SPACEID, articleId)
    res.json(resMapper.objReplaceKeyName(feedbacks, '_id', 'id'))
  }
}

export const supportArticleController = SupportArticleController.getInstance();