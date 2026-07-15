const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { isAdmin } = require('../middleware/auth');

router.get('/admin', isAdmin, (req, res) => {
  res.sendFile('admin.html', { root: 'public' });
});

router.get('/admin/me', isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id).select('username');
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    return res.json({ username: user.username });
  } catch (err) {
    console.error('Error al obtener perfil:', err);
    return res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

router.put('/admin/profile', isAdmin, async (req, res) => {
  try {
    const { username, newPassword, pin } = req.body;

    if (!pin) {
      return res.status(400).json({ error: 'El PIN de verificacion es obligatorio' });
    }
    if (pin !== process.env.ADMIN_PIN) {
      return res.status(403).json({ error: 'PIN de verificacion incorrecto' });
    }

    const admin = await User.findById(req.session.user.id).select('+password');
    if (!admin) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (username !== undefined && username.trim() !== '') {
      const trimmed = username.trim();
      if (trimmed.length < 3) {
        return res.status(400).json({ error: 'El usuario debe tener al menos 3 caracteres' });
      }
      const existing = await User.findOne({ username: trimmed, _id: { $ne: admin._id } });
      if (existing) {
        return res.status(409).json({ error: 'Ese nombre de usuario ya esta en uso' });
      }
      admin.username = trimmed;
    }

    if (newPassword !== undefined && newPassword.trim() !== '') {
      if (newPassword.trim().length < 6) {
        return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
      }
      admin.password = newPassword.trim();
    }

    await admin.save();

    req.session.user.username = admin.username;

    return res.json({ success: true, username: admin.username });
  } catch (err) {
    console.error('Error al actualizar perfil:', err);
    return res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

router.get('/admin/users', isAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).populate('iframes').select('-password').sort({ createdAt: -1 });
    return res.json(users);
  } catch (err) {
    console.error('Error al obtener usuarios:', err);
    return res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

router.post('/admin/users', isAdmin, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' });
    }

    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(409).json({ error: 'El nombre de usuario ya existe' });
    }

    const user = new User({ username, password, role: 'user', iframes: [] });
    await user.save();

    return res.status(201).json({
      _id: user._id,
      username: user.username,
      role: user.role,
      iframes: [],
      createdAt: user.createdAt
    });
  } catch (err) {
    console.error('Error al crear usuario:', err);
    return res.status(500).json({ error: 'Error al crear usuario' });
  }
});

router.put('/admin/users/:id', isAdmin, async (req, res) => {
  try {
    const { username, iframes, password, pin } = req.body;

    if (password !== undefined && password.trim() !== '') {
      if (!pin) {
        return res.status(400).json({ error: 'El PIN de verificacion es obligatorio para cambiar la contraseña' });
      }
      if (pin !== process.env.ADMIN_PIN) {
        return res.status(403).json({ error: 'PIN de verificacion incorrecto' });
      }
    }

    if (username !== undefined) {
      const existing = await User.findOne({ username, _id: { $ne: req.params.id } });
      if (existing) {
        return res.status(409).json({ error: 'El nombre de usuario ya existe' });
      }
    }

    const user = await User.findById(req.params.id).select('+password');
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (username !== undefined) {
      user.username = username;
    }

    if (iframes !== undefined) {
      user.iframes = iframes;
    }

    if (password !== undefined && password.trim() !== '') {
      user.password = password.trim();
    }

    await user.save();

    const updated = await User.findById(user._id).populate('iframes').select('-password');
    return res.json(updated);
  } catch (err) {
    console.error('Error al actualizar usuario:', err);
    return res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

router.delete('/admin/users/:id', isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    return res.json({ success: true, message: 'Usuario eliminado' });
  } catch (err) {
    console.error('Error al eliminar usuario:', err);
    return res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

module.exports = router;
