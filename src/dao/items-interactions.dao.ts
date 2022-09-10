import { Collection, Db, MongoClient, ObjectId } from 'mongodb'
import MongoClientConfigs from '../common/configs/mongodb-client.config'
import { DefaultMostItemsInteractionsLimit, ItemsInteractions, ItemsInteractionsCollectionName, DescOrder } from '../common/consts'

let _itemsInteractions: Collection
let _db: Db

export default class ItemsInteractionsDao {
  static async injectDB(conn: MongoClient) {
    if (_itemsInteractions) {
      return
    }

    try {
      _db = conn.db(MongoClientConfigs.DatabaseName)
      _itemsInteractions = conn.db(MongoClientConfigs.DatabaseName).collection(ItemsInteractionsCollectionName)

      _db.command({
        collMod: ItemsInteractionsCollectionName,
        validator: {
          $jsonSchema: {
            type: 'object',
            properties: {
              _id: {
                bsonType: 'objectId'
              },
              setId: {
                bsonType: 'objectId'
              },
              itemId: {
                bsonType: 'objectId'
              },
              userId: {
                bsonType: 'objectId'
              },
              interactionCount: {
                type: 'object',
                properties: {
                  ...ItemsInteractions.reduce((previousValue, interaction) => ({
                    ...previousValue, [interaction]: ({
                      bsonType: 'int'
                    })
                  }), {})
                },
                additionalProperties: false
              },
              lastUpdated: {
                bsonType: 'date'
              }
            },
            additionalProperties: false,
          }
        }
      })

      _itemsInteractions.createIndex({ userId: 1, setId: 1, itemId: 1 }, { name: 'userId_1_setId_1_itemId_1' })
    } catch (e) {
      console.error(
        `Unable to establish a collection handle in ItemsInteractionsDao: ${e}`,
      )
    }
  }

  static async interactItem(action, userId, setId, itemId, increment = 1) {
    try {
      return await _itemsInteractions
        .updateOne(
          {
            userId: new ObjectId(userId),
            setId: new ObjectId(setId),
            itemId: new ObjectId(itemId)
          },
          {
            $inc: {
              [`interactionCount.${action}`]: increment
            },
            $set: { lastUpdated: new Date() }
          },
          {
            upsert: true
          }
        )
    } catch (e) {
      console.log(arguments)
      console.error(`Error, ${e}, ${e.stack}`)
      return false
    }
  }

  static async getTopInteractItem(action, userId, setId, order, limit = DefaultMostItemsInteractionsLimit) {
    let sortField = `interactionCount.${action}`
    try {
      return await _itemsInteractions
        .aggregate([
          {
            $match: {
              setId: new ObjectId(setId),
              userId: new ObjectId(userId)
            },
          },
          { $sort: { [sortField]: order === DescOrder ? -1 : 1 } },
          {
            $limit: limit
          },
        ])
        .toArray()
    } catch (e) {
      console.log(arguments)
      console.error(`Error, ${e}, ${e.stack}`)
      return false
    }
  }

  static async getSetItemsInteract(userId, setId) {
    try {
      return await _itemsInteractions
        .find({
          setId,
          userId
        }, {
          projection: {
            _id: 0,
            itemId: 1,
            interactionCount: 1
          }
        })
        .toArray() || []
    } catch (e) {
      console.log(arguments)
      console.error(`Error, ${e}, ${e.stack}`)
      return []
    }
  }

  static async countInteractedItems(userId: ObjectId, interaction: string): Promise<number> {
    try {
      return await _itemsInteractions
        .countDocuments({
          userId,
          [`interactionCount.${interaction}`]: { $gt: 0 }
        })
    } catch (e) {
      console.log(arguments)
      console.error(`Error, ${e}, ${e.stack}`)
      return 0
    }
  }

  static async getInteractedItems(userId: ObjectId, interaction: string, skip: number, limit: number) {
    try {
      return await _itemsInteractions
        .aggregate([
          {
            '$match': {
              'userId': userId,
              [`interactionCount.${interaction}`]: {
                '$gt': 0
              }
            }
          }, {
            '$addFields': {
              'isStar': {
                '$eq': [
                  {
                    '$mod': [
                      '$interactionCount.star', 2
                    ]
                  }, 1
                ]
              }
            }
          }, {
            '$match': {
              'isStar': true
            }
          }, {
            '$lookup': {
              'from': 'sets',
              'localField': 'setId',
              'foreignField': '_id',
              'as': 'set'
            }
          }, {
            '$unwind': {
              'path': '$set'
            }
          }, {
            '$project': {
              'item': {
                '$filter': {
                  'input': '$set.items',
                  'as': 'items',
                  'cond': {
                    '$eq': [
                      '$$items._id', '$itemId'
                    ]
                  }
                }
              },
              '_id': 0
            }
          }, {
            '$unwind': {
              'path': '$item'
            }
          }, {
            '$skip': skip
          }, {
            '$limit': limit
          }
        ])
        .toArray()
    } catch (e) {
      console.log(arguments)
      console.error(`Error, ${e}, ${e.stack}`)
      return false
    }
  }
}
