const axios = require('axios');
const jwt = require('jsonwebtoken');
const { userSchema: User, sessionSchema: Session } = require('../../../schema');

const createToken = async (user, secret, expiresIn) => {
  const {
    uid, email,
  } = user
  return jwt.sign({
    uid, email,
  }, secret, { expiresIn })
}

const googleAuth = async (res, userData) => {
  try {
    let user = await User.findOne({
      uid: userData.uid,
    })

    if (!user) {
      user = await User.create(userData);

      const accessToken = await createToken(user, process.env.JWT_ACCESS_TOKEN_SECRET, '7d');

      await Session.create({ uid: user.uid, accessToken: accessToken })

      return res.status(200).json({
        success: true,
        user: user,
        accessToken,
      });
    }

    if (user.email) {
      const accessToken = await createToken(user, process.env.JWT_ACCESS_TOKEN_SECRET, '7d');

      await Session.create({ uid: user.uid, accessToken: accessToken })
      return res.status(200).json({
        success: true,
        user: user,
        accessToken,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Not Authorized',
    });
  }
  catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

const googleSignin = async (req, res) => {
  try {

    let userData = null

    const { accessToken } = req.body;

    if (!accessToken) return res.status(403).json({ message: "google accesToken not present" })

    axios.get("https://www.googleapis.com/oauth2/v1/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` }
    }).then((googleResp) => {
      userData = {
        uid: googleResp.data.id,
        name: googleResp.data.name,
        email: googleResp.data.email,
        imageUrl: googleResp.data.picture
      }

      googleAuth(res, userData);

    }).catch((err) => {
      res.status(500).json({
        success: false,
        message: err
      })
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = googleSignin;