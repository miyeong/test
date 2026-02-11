const STORAGE_KEY = "company-notices-v2";
const ROWS_PER_PAGE = 10;

const defaultNotices = [
  { id: crypto.randomUUID(), isNotice: true, number: null, title: "[다브인터내셔널] ★설 한정 특가★ 건강기능 식품 4가지, 단 5일 반짝 세일!", author: "이주희", createdAt: "2026-02-09", views: 147, content: "설 한정 특가 이벤트 안내" },
  { id: crypto.randomUUID(), isNotice: true, number: null, title: "[기타공지] 인생코치 서비스 플랫폼 이전 및 홈페이지 통합 리뉴얼 안내", author: "임경성", createdAt: "2026-02-06", views: 65, content: "서비스 이전 및 리뉴얼 안내" },
  { id: crypto.randomUUID(), isNotice: true, number: null, title: "[ERP/시스템] 수업리포트를 분석하는 AI코칭어시스턴트 서비스 종료안내", author: "박재경", createdAt: "2026-01-14", views: 411, content: "서비스 종료 공지" },
  { id: crypto.randomUUID(), isNotice: false, number: 11744, title: "[물류/배송] 2026년 설 택배 마감 일정 안내", author: "송승민", createdAt: "2026-02-10", views: 33, content: "택배 마감 일정을 확인해 주세요." },
  { id: crypto.randomUUID(), isNotice: false, number: 11743, title: "[기타공지] 비전마케팅부 12월 프로모션 내역입니다", author: "김경미", createdAt: "2026-02-10", views: 65, content: "12월 프로모션 안내" },
  { id: crypto.randomUUID(), isNotice: false, number: 11742, title: "[기타공지] 코칭회원관리에 수금된 회비 매칭취소 가능합니다", author: "김현수", createdAt: "2026-02-10", views: 111, content: "회원관리 메뉴 개선 안내" },
  { id: crypto.randomUUID(), isNotice: false, number: 11741, title: "[기타공지] 마수대체 처리방법 공지드립니다.", author: "김현수", createdAt: "2026-02-10", views: 124, content: "처리방법 안내" },
  { id: crypto.randomUUID(), isNotice: false, number: 11740, title: "[기타공지] 사업자번호 현금영수증 등록 방법", author: "김현수", createdAt: "2026-02-10", views: 58, content: "등록 방법 안내" },
  { id: crypto.randomUUID(), isNotice: false, number: 11739, title: "[기타공지] 수수료통장 변경안내", author: "김현수", createdAt: "2026-02-10", views: 75, content: "계좌 변경 안내" },
  { id: crypto.randomUUID(), isNotice: false, number: 11738, title: "[진학전략연구소] 2성적향상코칭 스페셜교육 베이직(BASIC) 37기 모집 알림", author: "콘텐츠연구개발팀", createdAt: "2026-02-10", views: 23, content: "모집 안내" },
  { id: crypto.randomUUID(), isNotice: false, number: 11737, title: "[더세이브] [CX팀] 2026 1월 마감 고객문의 이슈", author: "최현미", createdAt: "2026-02-09", views: 92, content: "마감 이슈 공유" },
  { id: crypto.randomUUID(), isNotice: false, number: 11736, title: "[다브인터내셔널] ★설 한정 특가★ 건강기능 식품 4가지, 단 5일 반짝 세일!", author: "이주희", createdAt: "2026-02-09", views: 147, content: "이벤트 안내" },
];

const tableBody = document.getElementById("notice-table-body");
const emptyState = document.getElementById("empty-state");
const rowTemplate = document.getElementById("notice-row-template");
const checkAll = document.getElementById("check-all");
const deleteSelectedBtn = document.getElementById("delete-selected-btn");
const openCreateBtn = document.getElementById("open-create-btn");
const noticeForm = document.getElementById("notice-form");
const modalTitle = document.getElementById("notice-modal-label");
const saveBtn = document.getElementById("save-btn");
const noticeIdInput = document.getElementById("notice-id");
const titleInput = document.getElementById("title");
const authorInput = document.getElementById("author");
const contentInput = document.getElementById("content");
const isNoticeInput = document.getElementById("is-notice");
const paginationNav = document.getElementById("pagination-nav");
const paginationEl = document.getElementById("pagination");

const noticeModal = new bootstrap.Modal(document.getElementById("notice-modal"));

let notices = loadNotices();
let currentPage = 1;

renderNotices();

openCreateBtn.addEventListener("click", () => {
  resetForm();
  modalTitle.textContent = "공지 작성";
  saveBtn.textContent = "등록";
});

noticeForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = titleInput.value.trim();
  const author = authorInput.value.trim();
  const content = contentInput.value.trim();

  if (!title || !author || !content) {
    return;
  }

  const existingId = noticeIdInput.value;
  const isNotice = isNoticeInput.checked;

  if (existingId) {
    notices = notices.map((notice) =>
      notice.id === existingId ? { ...notice, title, author, content, isNotice } : notice
    );
  } else {
    notices.push({
      id: crypto.randomUUID(),
      isNotice,
      number: null,
      title,
      author,
      content,
      createdAt: formatDate(new Date()),
      views: 0,
    });
  }

  applyRowNumbers();
  sortNotices();
  persistNotices();
  currentPage = 1;
  renderNotices();
  noticeModal.hide();
});

checkAll.addEventListener("change", () => {
  tableBody.querySelectorAll(".row-check").forEach((checkbox) => {
    checkbox.checked = checkAll.checked;
  });
});

deleteSelectedBtn.addEventListener("click", () => {
  const selectedIds = Array.from(tableBody.querySelectorAll(".row-check:checked")).map((checkbox) => checkbox.dataset.id);

  if (selectedIds.length === 0) {
    window.alert("삭제할 공지사항을 선택해 주세요.");
    return;
  }

  if (!window.confirm(`선택한 ${selectedIds.length}건의 공지사항을 삭제하시겠습니까?`)) {
    return;
  }

  notices = notices.filter((notice) => !selectedIds.includes(notice.id));
  applyRowNumbers();
  persistNotices();
  clampCurrentPage();
  renderNotices();
});

function loadNotices() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    const seeded = [...defaultNotices];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...defaultNotices];
  } catch {
    return [...defaultNotices];
  }
}

function persistNotices() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notices));
}

function sortNotices() {
  notices.sort((a, b) => {
    if (a.isNotice !== b.isNotice) {
      return Number(b.isNotice) - Number(a.isNotice);
    }

    if (a.number !== null && b.number !== null) {
      return b.number - a.number;
    }

    return b.createdAt.localeCompare(a.createdAt);
  });
}

function applyRowNumbers() {
  const maxNumber = notices
    .filter((notice) => Number.isInteger(notice.number))
    .reduce((max, current) => Math.max(max, current.number), 11729);

  let nextNumber = maxNumber;

  notices = notices.map((notice) => {
    if (notice.isNotice) {
      return { ...notice, number: null };
    }

    if (!Number.isInteger(notice.number)) {
      nextNumber += 1;
      return { ...notice, number: nextNumber };
    }

    return notice;
  });
}

function getPageItems() {
  sortNotices();
  const totalPages = Math.max(1, Math.ceil(notices.length / ROWS_PER_PAGE));
  currentPage = Math.min(Math.max(1, currentPage), totalPages);

  const start = (currentPage - 1) * ROWS_PER_PAGE;
  const end = start + ROWS_PER_PAGE;

  return {
    items: notices.slice(start, end),
    totalPages,
  };
}

function renderNotices() {
  tableBody.innerHTML = "";
  checkAll.checked = false;

  const { items, totalPages } = getPageItems();

  emptyState.classList.toggle("d-none", notices.length > 0);
  paginationNav.classList.toggle("d-none", notices.length === 0);

  items.forEach((notice) => {
    const fragment = rowTemplate.content.cloneNode(true);
    const numberEl = fragment.querySelector(".notice-number");
    const rowCheck = fragment.querySelector(".row-check");
    const badge = fragment.querySelector(".notice-badge");
    const titleBtn = fragment.querySelector(".notice-title");
    const authorEl = fragment.querySelector(".notice-author");
    const dateEl = fragment.querySelector(".notice-date");
    const viewsEl = fragment.querySelector(".notice-views");
    const editBtn = fragment.querySelector(".edit-btn");
    const deleteBtn = fragment.querySelector(".delete-btn");

    numberEl.textContent = notice.isNotice ? "공지" : String(notice.number ?? "-");
    rowCheck.dataset.id = notice.id;

    badge.classList.toggle("d-none", !notice.isNotice);
    titleBtn.textContent = notice.title;
    authorEl.textContent = notice.author;
    dateEl.textContent = notice.createdAt;
    viewsEl.textContent = String(notice.views);

    titleBtn.addEventListener("click", () => {
      notices = notices.map((item) => (item.id === notice.id ? { ...item, views: item.views + 1 } : item));
      persistNotices();
      renderNotices();
      openEditModal(notice.id);
    });

    editBtn.addEventListener("click", () => {
      openEditModal(notice.id);
    });

    deleteBtn.addEventListener("click", () => {
      if (!window.confirm("이 공지사항을 삭제하시겠습니까?")) {
        return;
      }

      notices = notices.filter((item) => item.id !== notice.id);
      applyRowNumbers();
      persistNotices();
      clampCurrentPage();
      renderNotices();
    });

    tableBody.append(fragment);
  });

  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  paginationEl.innerHTML = "";

  const prevDisabled = currentPage === 1 ? " disabled" : "";
  paginationEl.insertAdjacentHTML(
    "beforeend",
    `<li class="page-item${prevDisabled}"><button class="page-link" data-page="${currentPage - 1}" aria-label="이전">&laquo;</button></li>`
  );

  for (let page = 1; page <= totalPages; page += 1) {
    const active = page === currentPage ? " active" : "";
    paginationEl.insertAdjacentHTML(
      "beforeend",
      `<li class="page-item${active}"><button class="page-link" data-page="${page}">${page}</button></li>`
    );
  }

  const nextDisabled = currentPage === totalPages ? " disabled" : "";
  paginationEl.insertAdjacentHTML(
    "beforeend",
    `<li class="page-item${nextDisabled}"><button class="page-link" data-page="${currentPage + 1}" aria-label="다음">&raquo;</button></li>`
  );

  paginationEl.querySelectorAll(".page-link").forEach((button) => {
    button.addEventListener("click", () => {
      const targetPage = Number(button.dataset.page);

      if (!Number.isInteger(targetPage) || targetPage < 1 || targetPage > totalPages || targetPage === currentPage) {
        return;
      }

      currentPage = targetPage;
      renderNotices();
    });
  });
}

function clampCurrentPage() {
  const totalPages = Math.max(1, Math.ceil(notices.length / ROWS_PER_PAGE));
  currentPage = Math.min(currentPage, totalPages);
}

function openEditModal(id) {
  const target = notices.find((notice) => notice.id === id);

  if (!target) {
    return;
  }

  noticeIdInput.value = target.id;
  titleInput.value = target.title;
  authorInput.value = target.author;
  contentInput.value = target.content;
  isNoticeInput.checked = target.isNotice;
  modalTitle.textContent = "공지 수정";
  saveBtn.textContent = "수정 저장";
  noticeModal.show();
}

function resetForm() {
  noticeForm.reset();
  noticeIdInput.value = "";
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
