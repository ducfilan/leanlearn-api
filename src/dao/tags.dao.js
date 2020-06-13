import MongoClientConfigs from '../common/configs/mongodb-client.config'
import Consts from '../common/consts'

let tags
let db

export default class TagsDao {
  static async injectDB(conn) {
    if (tags) {
      return
    }

    try {
      db = await conn.db(MongoClientConfigs.DatabaseName)
      tags = await db.collection('tags')
    } catch (e) {
      console.error(
        `Unable to establish a collection handle in TagsDao: ${e}`,
      )
    }
  }

  static async findOne(tag) {
    return await tags.findOne({ tag })
  }

  static async getTagsStartWith(start_with) {
    try {
      return (
        await tags
          .find(
            { 'tag': { $regex: `^${start_with}`, $options: 'i' } },
            { limit: Consts.tagsSelectLimit }
          )
          .sort({ tag: 1 })
          .toArray()
      )
    } catch (e) {
      console.error(`Unable to issue find command, ${e}`)
      return {}
    }
  }

  static async createTag(tag) {
    try {
      return await tags.insertOne({ tag }).ops[0]
    } catch (e) {
      console.error(`Unable to issue insert command, ${e}`)
      return {}
    }
  }
}