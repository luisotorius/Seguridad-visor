document.addEventListener('DOMContentLoaded', async () => {
  const userLabel = document.getElementById('userLabel');
  const defaultMessage = document.getElementById('defaultMessage');
  const selectionView = document.getElementById('selectionView');
  const viewerView = document.getElementById('viewerView');
  const viewerFrame = document.getElementById('viewerFrame');
  const iframeGrid = document.getElementById('iframeGrid');
  const btnBack = document.getElementById('btnBack');
  const formSection = document.getElementById('formSection');

  let iframes = [];

  try {
    const res = await fetch('/dashboard/user');
    const data = await res.json();
    userLabel.textContent = data.username;
    iframes = data.iframes || [];
  } catch {
    userLabel.textContent = 'Error al cargar datos';
    return;
  }

  if (iframes.length > 0) {
    defaultMessage.classList.add('d-none');
    selectionView.classList.remove('d-none');
    renderSelection();
  }

  formSection.classList.remove('d-none');

  btnBack.addEventListener('click', () => {
    viewerView.classList.add('d-none');
    selectionView.classList.remove('d-none');
    formSection.classList.remove('d-none');
    btnBack.classList.add('d-none');
    viewerFrame.innerHTML = '';
  });

  function renderSelection() {
    iframeGrid.innerHTML = iframes.map((iframe, i) => `
      <div class="col-md-6 col-lg-4 col-xl-3">
        <div class="card shadow-sm h-100 iframe-card" role="button" data-index="${i}">
          <div class="card-body d-flex flex-column align-items-center justify-content-center text-center py-4">
            <div class="mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0d6efd" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            </div>
            <h5 class="card-title fw-bold mb-2">${escapeHtml(iframe.name)}</h5>
            <span class="btn btn-primary btn-sm mt-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Entrar
            </span>
          </div>
        </div>
      </div>
    `).join('');

    document.querySelectorAll('.iframe-card').forEach(card => {
      card.addEventListener('click', () => {
        const index = parseInt(card.getAttribute('data-index'));
        openViewer(index);
      });
    });
  }

  function openViewer(index) {
    const iframe = iframes[index];
    selectionView.classList.add('d-none');
    defaultMessage.classList.add('d-none');
    formSection.classList.add('d-none');
    viewerView.classList.remove('d-none');
    btnBack.classList.remove('d-none');

    viewerFrame.innerHTML = `<iframe src="${escapeHtml(iframe.url)}" frameborder="0" width="100%" height="100%" allow="fullscreen" style="border:1px solid #EAEAEA;border-radius:4px;"></iframe>`;
  }
});

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
