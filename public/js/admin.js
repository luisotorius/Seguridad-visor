let allIframes = [];
let editModal, deleteModal, editIframeModal, adminSettingsModal;

document.addEventListener('DOMContentLoaded', () => {
  editModal = new bootstrap.Modal(document.getElementById('editModal'));
  deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
  editIframeModal = new bootstrap.Modal(document.getElementById('editIframeModal'));
  adminSettingsModal = new bootstrap.Modal(document.getElementById('adminSettingsModal'));
  loadIframes();
  loadUsers();

  document.getElementById('editPassword').addEventListener('input', (e) => {
    const pinField = document.getElementById('editPinField');
    if (e.target.value.trim().length > 0) {
      pinField.style.display = 'block';
    } else {
      pinField.style.display = 'none';
      document.getElementById('editPin').value = '';
    }
  });
});

document.getElementById('createIframeForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('iframeName').value.trim();
  const url = document.getElementById('iframeUrl').value.trim();

  if (!name || !url) {
    showIframeAlert('Completa todos los campos', 'danger');
    return;
  }

  try {
    const res = await fetch('/admin/iframes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, url })
    });
    const data = await res.json();
    if (!res.ok) {
      showIframeAlert(data.error || 'Error al crear iframe', 'danger');
      return;
    }
    showIframeAlert('Iframe creado exitosamente', 'success');
    e.target.reset();
    loadIframes();
  } catch {
    showIframeAlert('Error de conexion', 'danger');
  }
});

document.getElementById('createUserForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('newUsername').value.trim();
  const password = document.getElementById('newPassword').value;

  if (!username || !password) {
    showCreateAlert('Completa todos los campos', 'danger');
    return;
  }

  try {
    const res = await fetch('/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) {
      showCreateAlert(data.error || 'Error al crear usuario', 'danger');
      return;
    }
    showCreateAlert('Usuario creado exitosamente', 'success');
    e.target.reset();
    loadUsers();
  } catch {
    showCreateAlert('Error de conexion', 'danger');
  }
});

document.getElementById('btnRefreshIframes').addEventListener('click', loadIframes);
document.getElementById('btnRefresh').addEventListener('click', loadUsers);

async function loadIframes() {
  try {
    const res = await fetch('/admin/iframes');
    allIframes = await res.json();

    const tbody = document.getElementById('iframesTableBody');
    if (allIframes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-4">No hay iframes creados</td></tr>';
      return;
    }

    tbody.innerHTML = allIframes.map(f => `
      <tr>
        <td><strong>${escapeHtml(f.name)}</strong></td>
        <td><span class="text-truncate d-inline-block" style="max-width:250px;" title="${escapeHtml(f.url)}">${escapeHtml(f.url)}</span></td>
        <td class="text-end">
          <button class="btn btn-outline-primary btn-sm me-1" onclick="openEditIframe('${f._id}', '${escapeAttr(f.name)}', '${escapeAttr(f.url)}')">Editar</button>
          <button class="btn btn-outline-danger btn-sm" onclick="openDelete('iframe', '${f._id}', '${escapeAttr(f.name)}')">Eliminar</button>
        </td>
      </tr>
    `).join('');
  } catch {
    document.getElementById('iframesTableBody').innerHTML =
      '<tr><td colspan="3" class="text-center text-danger py-4">Error al cargar iframes</td></tr>';
  }
}

async function loadUsers() {
  try {
    const res = await fetch('/admin/users');
    const users = await res.json();

    const tbody = document.getElementById('usersTableBody');
    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No hay usuarios creados</td></tr>';
      return;
    }

    tbody.innerHTML = users.map(user => {
      const iframeNames = user.iframes && user.iframes.length > 0
        ? user.iframes.map(f => escapeHtml(f.name)).join(', ')
        : '<em class="text-muted">Ninguno</em>';
      return `
        <tr>
          <td><strong>${escapeHtml(user.username)}</strong></td>
          <td>${iframeNames}</td>
          <td class="small text-muted">${new Date(user.createdAt).toLocaleDateString('es-ES')}</td>
          <td class="text-end">
            <button class="btn btn-outline-primary btn-sm me-1" onclick="openEditUser('${user._id}', '${escapeAttr(user.username)}', ${JSON.stringify(user.iframes.map(f => f._id)).replace(/"/g, '&quot;')})">Editar</button>
            <button class="btn btn-outline-danger btn-sm" onclick="openDelete('user', '${user._id}', '${escapeAttr(user.username)}')">Eliminar</button>
          </td>
        </tr>
      `;
    }).join('');
  } catch {
    document.getElementById('usersTableBody').innerHTML =
      '<tr><td colspan="4" class="text-center text-danger py-4">Error al cargar usuarios</td></tr>';
  }
}

function openEditIframe(id, name, url) {
  document.getElementById('editIframeId').value = id;
  document.getElementById('editIframeName').value = name;
  document.getElementById('editIframeUrl').value = url;
  editIframeModal.show();
}

document.getElementById('btnSaveIframe').addEventListener('click', async () => {
  const id = document.getElementById('editIframeId').value;
  const name = document.getElementById('editIframeName').value.trim();
  const url = document.getElementById('editIframeUrl').value.trim();

  try {
    const res = await fetch(`/admin/iframes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, url })
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Error al actualizar');
      return;
    }
    editIframeModal.hide();
    loadIframes();
  } catch {
    alert('Error de conexion');
  }
});

function openEditUser(id, username, assignedIds) {
  document.getElementById('editUserId').value = id;
  document.getElementById('editUsername').value = username;

  document.getElementById('editPassword').value = '';
  document.getElementById('editPin').value = '';
  document.getElementById('editPinField').style.display = 'none';

  const container = document.getElementById('iframeCheckboxList');
  if (allIframes.length === 0) {
    container.innerHTML = '<span class="text-muted">No hay iframes disponibles. Crea uno primero.</span>';
  } else {
    container.innerHTML = allIframes.map(f => `
      <div class="form-check">
        <input class="form-check-input" type="checkbox" value="${f._id}" id="chk_${f._id}" ${assignedIds.includes(f._id) ? 'checked' : ''}>
        <label class="form-check-label" for="chk_${f._id}">${escapeHtml(f.name)}</label>
      </div>
    `).join('');
  }

  editModal.show();
}

document.getElementById('btnSaveUser').addEventListener('click', async () => {
  const id = document.getElementById('editUserId').value;
  const username = document.getElementById('editUsername').value.trim();
  const password = document.getElementById('editPassword').value;
  const pin = document.getElementById('editPin').value;

  const checkboxes = document.querySelectorAll('#iframeCheckboxList .form-check-input:checked');
  const iframes = Array.from(checkboxes).map(cb => cb.value);

  const body = { username, iframes };
  if (password.trim().length > 0) {
    if (!pin) {
      alert('Debes ingresar el PIN de verificacion para cambiar la contraseña');
      return;
    }
    body.password = password;
    body.pin = pin;
  }

  try {
    const res = await fetch(`/admin/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Error al actualizar');
      return;
    }
    editModal.hide();
    loadUsers();
  } catch {
    alert('Error de conexion');
  }
});

function openDelete(type, id, name) {
  document.getElementById('deleteItemId').value = id;
  document.getElementById('deleteItemType').value = type;
  document.getElementById('deleteMessage').textContent =
    type === 'iframe'
      ? `Eliminar el iframe "${name}"?`
      : `Eliminar al usuario "${name}"?`;
  deleteModal.show();
}

document.getElementById('btnConfirmDelete').addEventListener('click', async () => {
  const id = document.getElementById('deleteItemId').value;
  const type = document.getElementById('deleteItemType').value;
  const endpoint = type === 'iframe' ? `/admin/iframes/${id}` : `/admin/users/${id}`;

  try {
    const res = await fetch(endpoint, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Error al eliminar');
      return;
    }
    deleteModal.hide();
    if (type === 'iframe') loadIframes();
    else loadUsers();
  } catch {
    alert('Error de conexion');
  }
});

async function openAdminSettings() {
  const alertEl = document.getElementById('adminSettingsAlert');
  alertEl.className = 'alert d-none';
  document.getElementById('adminNewPassword').value = '';
  document.getElementById('adminConfirmPassword').value = '';
  document.getElementById('adminCurrentPassword').value = '';

  try {
    const res = await fetch('/admin/me');
    const data = await res.json();
    document.getElementById('adminUsername').value = data.username || '';
  } catch {
    document.getElementById('adminUsername').value = '';
  }

  adminSettingsModal.show();
}

document.getElementById('btnSaveAdminProfile').addEventListener('click', async () => {
  const alertEl = document.getElementById('adminSettingsAlert');
  const username = document.getElementById('adminUsername').value.trim();
  const newPassword = document.getElementById('adminNewPassword').value;
  const confirmPassword = document.getElementById('adminConfirmPassword').value;
  const pin = document.getElementById('adminCurrentPassword').value;

  if (!pin) {
    showAdminAlert('Debes ingresar el PIN de verificacion para guardar', 'danger');
    return;
  }

  if (newPassword || confirmPassword) {
    if (newPassword !== confirmPassword) {
      showAdminAlert('Las contrasenas nuevas no coinciden', 'danger');
      return;
    }
    if (newPassword.length < 6) {
      showAdminAlert('La nueva contraseña debe tener al menos 6 caracteres', 'danger');
      return;
    }
  }

  try {
    const res = await fetch('/admin/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, newPassword, pin })
    });
    const data = await res.json();
    if (!res.ok) {
      showAdminAlert(data.error || 'Error al actualizar', 'danger');
      return;
    }
    showAdminAlert('Perfil actualizado correctamente', 'success');
    setTimeout(() => {
      adminSettingsModal.hide();
      if (data.username) {
        document.querySelector('.navbar-brand').textContent = `INEVIEWER - ${data.username}`;
      }
    }, 1000);
  } catch {
    showAdminAlert('Error de conexion', 'danger');
  }
});

function showIframeAlert(message, type) {
  const el = document.getElementById('iframeAlert');
  el.textContent = message;
  el.className = `alert alert-${type}`;
}

function showCreateAlert(message, type) {
  const el = document.getElementById('createAlert');
  el.textContent = message;
  el.className = `alert alert-${type}`;
}

function showAdminAlert(message, type) {
  const el = document.getElementById('adminSettingsAlert');
  el.textContent = message;
  el.className = `alert alert-${type}`;
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  if (!str) return '';
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
