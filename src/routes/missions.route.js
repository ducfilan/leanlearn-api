import { Router } from 'express'
import MissionsController from '../controllers/missions.controller'
import auth from '../middlewares/global/auth.mw'

const securedMissionsRouter = new Router()

securedMissionsRouter.route('').post(auth, MissionsController.apiGetMissions)

export { securedMissionsRouter }
