import _ from 'lodash'
import htmlToText from 'html-to-text'
import supportTopicModel from '../models/supportTopicModel';
import supportArticleModel from '../models/supportArticleModel';
import improvementModel from '../models/improvementModel';
import feedbackModel from '../models/feedbackModel';
import { CreateArticleDto, CreateTopicDto, CreateImprovementDto, CreateFeedbackDto } from '../dto';
import { SupportTopic, SupportArticle, Improvement } from '../types';
import { SpaceService } from '../services/spaceSvc';
import { Types } from 'mongoose';
const spaceSvc = SpaceService.getInstance()
const cError = require('../helper/customError')
const mongoose = require('mongoose')
const User = mongoose.model('User')

export class SupportArticleService {

  static INSTANCE: SupportArticleService;
  static getInstance(): SupportArticleService {
    if (!SupportArticleService.INSTANCE) {
      SupportArticleService.INSTANCE = new SupportArticleService();
    }
    return SupportArticleService.INSTANCE;
  }

  convertToText(text: String, newlineToBe = ' '): String{
    return htmlToText.fromString(text, {ignoreImage: true, wordwrap: false}).replace(/(?:\r\n|\r|\n)/g, newlineToBe)
  }

  async fetchAllFbImprvs(spaceId: string): Promise<Improvement[]> {
    return await improvementModel.find({spaceId, valid: true}, "-spaceId -valid")
  }

  async addImprovements(spaceId: string, dto: CreateImprovementDto): Promise<Improvement> {
    const record = {spaceId, text: dto.text, valid: true}
    const options = { upsert: true, new: true, projection: "-spaceId -valid"}
    return await improvementModel.findOneAndUpdate(record, record, options)
  }

  async editImprovements(spaceId: string, improvementId: string, dto: CreateImprovementDto): Promise<Improvement> {
    const options = { upsert: false, new: true, projection: "-spaceId -valid" }
    const improvement = await improvementModel.findOneAndUpdate({_id: improvementId, spaceId, valid: true}, {text: dto.text}, options)
    if (!improvement) {
      throw new cError.ResourceNotFoundException(`Improvement item not found with Id: ${improvementId}`)
    } else {
      return improvement
    }
  }

  async deleteImprovement(spaceId: string, improvementId: string):  Promise<Improvement> {
    const options = { upsert: false, new: true, projection: "-spaceId -valid" }
    const impr = await improvementModel.findOneAndUpdate({_id: improvementId, spaceId, valid: true}, {valid: false}, options)
    if (!impr) {
      throw new cError.ResourceNotFoundException(`Improvement item not found with Id: ${improvementId}`)
    } else {
      return impr
    }
  }

  async getTopic(_id: string | Types.ObjectId): Promise<SupportTopic> {
    return await supportTopicModel.findOne({_id, valid: true}, "-spaceId -valid")
  }

  async fetchAllTopics(spaceId: string): Promise<SupportTopic[]> {
    return await supportTopicModel.find({spaceId, valid: true}, "-spaceId -valid")
  }

  async addTopic(spaceId: string, createTopicDto: CreateTopicDto): Promise<SupportTopic> {
    const t = createTopicDto
    const options = { upsert: true, new: true, projection: "-spaceId -valid"}
    return supportTopicModel.findOneAndUpdate({spaceId, name: t.name, icon: t.icon, valid: true}, {spaceId, name: t.name, icon: t.icon, valid: true}, options)
  }

  async editTopic(spaceId: string, topicId: string, editTopicDto: CreateTopicDto): Promise<SupportTopic> {
    const t = editTopicDto
    const options = { upsert: false, new: true, projection: "-spaceId -valid" }
    const topicEdit = await supportTopicModel.findOneAndUpdate({_id: topicId, spaceId, valid: true}, {name: t.name, icon: t.icon}, options)
    if (!topicEdit) {
      throw new cError.ResourceNotFoundException(`Topic not found with Id: ${topicId}`)
    } else {
      return topicEdit
    }
  }

  async deleteTopic(spaceId: string, topicId: string): Promise<SupportTopic> {
    const options = { upsert: false, new: true, projection: "-spaceId -valid" }
    const topicEdit = await supportTopicModel.findOneAndUpdate({_id: topicId, spaceId, valid: true}, {valid: false}, options)
    if (!topicEdit) {
      throw new cError.ResourceNotFoundException(`Topic not found with Id: ${topicId}`)
    } else {
      await supportArticleModel.update({topicId}, {topicId: null})
      return topicEdit
    }
  }

  async newArticle(USID: string, spaceId: string, createArticleDto: CreateArticleDto): Promise<SupportArticle> {
    const article = {
      USID,
      title: createArticleDto.title,
      text: createArticleDto.text,
      htmlInText: this.convertToText(createArticleDto.text),
      topicId: createArticleDto.topicId,
      isPublished: createArticleDto.isPublished,
      spaceId,
      valid: 1,
    }
    return supportArticleModel.create(article)
  }

  async getArticleById(spaceId: string, articleId: string): Promise<SupportArticle> {
    const article = await supportArticleModel.findOne({_id: articleId, spaceId, valid: 1}, "-spaceId -htmlInText")
    if (!article){
      throw new cError.ResourceNotFoundException(`Article not found with Id: ${articleId}`)
    } else {
      return article
    }
  }

  async searchArticles(spaceId: string, topicId: string, search: string): Promise<SupportArticle[]> {
    const textSearch = {$text: {$search: search}}
    const query = _.pickBy({spaceId, topicId, valid: 1, ...textSearch}, v => v !== undefined)
    return await supportArticleModel.find(query, "-htmlInText").sort({views: -1}).lean()
  }

  async getArticles(spaceId: string, topicId: string): Promise<SupportArticle[]> {
    const query = _.pickBy({spaceId, topicId, valid: 1}, v => v !== undefined)
    return await supportArticleModel.find(query, "-htmlInText").sort({views: -1}).lean()
  }

  async editArticle(spaceId: string, articleId: string, createArticleDto: CreateArticleDto, ts: number): Promise<SupportArticle> {
    if (createArticleDto.topicId) {
      const topic = await supportTopicModel.findOne({_id: createArticleDto.topicId, spaceId, valid: true})
      if (!topic) {
        throw new cError.ResourceNotFoundException(`Topic not found with Id: ${createArticleDto.topicId}`)
      }
    }
    const options = { new: true, fields: "-htmlInText" }
    const updateFields = _.pickBy(createArticleDto, v => v !== undefined)
    const update = _.assign({}, {updatedAt: ts}, updateFields)
    if (update.text) {
      update.htmlInText = this.convertToText(update.text)
    }
    const article = await supportArticleModel.findOneAndUpdate({_id: articleId, spaceId, valid: 1}, update, options).lean()
    if (!article){
      throw new cError.ResourceNotFoundException(`Article not found with Id: ${articleId}`)
    } else {
      return article
    }
  }

  async deleteArticle(spaceId: string, articleId: string): Promise<SupportArticle> {
    const options = { upsert: false, new: true, fields: "-htmlInText" }
    const article = await supportArticleModel.findOneAndUpdate({_id: articleId, spaceId, valid: 1}, {valid: 0}, options).lean()
    if (!article) {
      throw new cError.ResourceNotFoundException(`Article not found with Id: ${articleId}`)
    } else {
      return article
    }
  }

  async increaseViews(spaceId: string, articleId: string): Promise<SupportArticle> {
    const options = { new: true, fields: "-htmlInText" };
    return supportArticleModel.findOneAndUpdate({ _id: articleId, spaceId, valid: 1 }, { $inc: { views: 1 } }, options).lean();
  }

  async createFeedback(USID: string, spaceId: string, articleId: string, dto: CreateFeedbackDto, userId: string) {
    if (dto.improvementId) {
      const improvement = await improvementModel.findOne({_id: dto.improvementId, spaceId})
      if (!improvement) {
        throw new cError.ResourceNotFoundException(`Improvement item not found with Id: ${dto.improvementId}`)
      }
    }

    const article = await supportArticleModel.findOne({_id: articleId, spaceId})
    if (!article) {
      throw new cError.ResourceNotFoundException(`Article not found with Id: ${articleId}`)
    }

    const feedback = {USID, spaceId, articleId, ...dto}
    const feedbackDb = await feedbackModel.create(feedback)
    const user = await User.getUserById(userId)
    const fields = ["articleId", "isHelpful", "improvementId", "tellUsMore", "createdAt", "_id"]
    const feedbackRes = _.pick(feedbackDb.toObject(), fields)
    return {
      ...feedbackRes,
      user: _.pick(user, ['email', 'surname', 'name', '_id'])
    }
  }

  async getArticleFeedbacks(spaceId: string, articleId: string) {
    const feedbacks = await feedbackModel.find({articleId, spaceId}, "-spaceId").lean()
    const USIDs = feedbacks.map(f => f.USID)
    const userSpaces = await spaceSvc.fetchUserSpacesByIds_(USIDs)
    const userIds = userSpaces.map(us => us.userId)
    const users = await User.listUserByIds(userIds)
    return feedbacks.map(f => {
      const fbUserSpace = userSpaces.find(us => String(us._id) === String(f.USID))
      const fbUser = users.find(u => String(u._id) === String(fbUserSpace.userId))
      f.user = _.pick(fbUser, ['email', 'surname', 'name', '_id'])
      delete f.USID
      return f
    })
  }

}
