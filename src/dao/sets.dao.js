import MongoClientConfigs from '../common/configs/mongodb-client.config'

let _sets
let _db

export default class SetsDao {
  static async injectDB(conn) {
    if (_sets) {
      return
    }

    try {
      _db = await conn.db(MongoClientConfigs.DatabaseName)
      _sets = await conn.db(MongoClientConfigs.DatabaseName).collection('sets')
    } catch (e) {
      console.error(
        `Unable to establish a collection handle in setsDao: ${e}`,
      )
    }
  }

  static async findOne(query) {
    return await _sets.findOne(query)
  }

  static async findOneById(_id) {
    try {
      var set = await _sets.findOne({ _id });
      return set;
    } catch (e) {
      console.error(`Unable to issue find command, ${e}`)
      return false;
    }
  }

  static async updateOne(_id, field, value) {
    try {
      var user = await _sets.findOneAndUpdate({ _id }, { $set: { [field]: value } });
      return user;
    } catch (e) {
      console.error(`Unable to issue find command, ${e}`)
      return false;
    }
  }

  static async createSet(set) {
    try {
      _sets.insert(set)
    } catch (e) {
      console.error(`Unable to execute insert command, ${e}`)
      return false;
    }
  }

  static async getSet(_id) {
    try {
      return await this.findOneById(_id)
    } catch (e) {
      console.error(`Unable to execute insert command, ${e}`)
      return false;
    }
  }
}