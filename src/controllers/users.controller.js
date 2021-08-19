import usersServices from '../services/api/users.services'

export default class UsersController {
  static async me(req, res) {
    return res.status(200).json(req.user);
  }

  static async register(req, res) {
    try {
      const registeredUser = await usersServices.register(req.body)

      res.status(200).send(registeredUser)
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  }

  static async update(req, res) {
    try {
      const isSuccess = await usersServices.update(req.user._id, req.body)
      if (!isSuccess) {
        res.status(400).json({ error: 'User not found' })
      }

      res.sendStatus(200)
    } catch (e) {
      res.status(400).send({ error: e.message })
    }
  }

  static async logout(req, res) {
    try {
      await usersServices.logout(req.user)

      res.sendStatus(200)
    } catch (e) {
      res.status(400).send({ error: e.message })
    }
  }
}
