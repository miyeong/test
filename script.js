const STORAGE_KEY = "company-notices-vue";
const ROWS_PER_PAGE = 10;

const defaultNotices = [
  { id: crypto.randomUUID(), isNotice: true, number: null, title: "[다브인터내셔널] ★설 한정 특가★ 건강기능 식품 4가지, 단 5일 반짝 세일!", author: "이주희", createdAt: "2026-02-09", views: 147, content: "설 한정 특가 이벤트 안내" },
  { id: crypto.randomUUID(), isNotice: true, number: null, title: "[기타공지] 인생코치 서비스 플랫폼 이전 및 홈페이지 통합 리뉴얼 안내", author: "임경성", createdAt: "2026-02-06", views: 65, content: "서비스 이전 및 리뉴얼 안내" },
  { id: crypto.randomUUID(), isNotice: false, number: 11744, title: "[물류/배송] 2026년 설 택배 마감 일정 안내", author: "송승민", createdAt: "2026-02-10", views: 33, content: "택배 마감 일정을 확인해 주세요." },
  { id: crypto.randomUUID(), isNotice: false, number: 11743, title: "[기타공지] 비전마케팅부 12월 프로모션 내역입니다", author: "김경미", createdAt: "2026-02-10", views: 65, content: "12월 프로모션 안내" },
  { id: crypto.randomUUID(), isNotice: false, number: 11742, title: "[기타공지] 코칭회원관리에 수금된 회비 매칭취소 가능합니다", author: "김현수", createdAt: "2026-02-10", views: 111, content: "회원관리 메뉴 개선 안내" },
];

const { createApp } = Vue;

function loadInitialNotices() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultNotices));
    return [...defaultNotices];
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...defaultNotices];
  } catch {
    return [...defaultNotices];
  }
}

createApp({
  data() {
    return {
      notices: loadInitialNotices(),
      search: {
        category: "all",
        field: "author",
        keyword: "",
      },
      form: {
        title: "",
        author: "",
        content: "",
        isNotice: false,
      },
      selectedIds: [],
      checkAll: false,
      currentPage: 1,
      editingId: null,
      modal: null,
    };
  },
  computed: {
    sortedNotices() {
      return [...this.notices].sort((a, b) => {
        if (a.isNotice !== b.isNotice) {
          return Number(b.isNotice) - Number(a.isNotice);
        }
        if (a.number !== null && b.number !== null) {
          return b.number - a.number;
        }
        return b.createdAt.localeCompare(a.createdAt);
      });
    },
    filteredNotices() {
      const keyword = this.search.keyword.trim().toLowerCase();
      return this.sortedNotices.filter((notice) => {
        if (this.search.category === "notice" && !notice.isNotice) {
          return false;
        }
        if (this.search.category === "general" && notice.isNotice) {
          return false;
        }
        if (!keyword) {
          return true;
        }
        if (this.search.field === "author") {
          return notice.author.toLowerCase().includes(keyword);
        }
        return notice.title.toLowerCase().includes(keyword) || notice.content.toLowerCase().includes(keyword);
      });
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.filteredNotices.length / ROWS_PER_PAGE));
    },
    pageItems() {
      const start = (this.currentPage - 1) * ROWS_PER_PAGE;
      return this.filteredNotices.slice(start, start + ROWS_PER_PAGE);
    },
  },
  watch: {
    filteredNotices() {
      if (this.currentPage > this.totalPages) {
        this.currentPage = this.totalPages;
      }
      this.selectedIds = this.selectedIds.filter((id) => this.filteredNotices.some((notice) => notice.id === id));
      this.checkAll = false;
    },
  },
  mounted() {
    this.modal = new bootstrap.Modal(document.getElementById("notice-modal"));
  },
  methods: {
    persist() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.notices));
    },
    searchNotices() {
      this.currentPage = 1;
    },
    toggleCheckAll() {
      if (!this.checkAll) {
        this.selectedIds = [];
        return;
      }
      this.selectedIds = this.pageItems.map((notice) => notice.id);
    },
    movePage(page) {
      if (page < 1 || page > this.totalPages || page === this.currentPage) {
        return;
      }
      this.currentPage = page;
      this.checkAll = false;
      this.selectedIds = [];
    },
    openCreateModal() {
      this.editingId = null;
      this.form = { title: "", author: "", content: "", isNotice: false };
    },
    openEditModal(id) {
      const target = this.notices.find((notice) => notice.id === id);
      if (!target) {
        return;
      }
      target.views += 1;
      this.persist();
      this.editingId = id;
      this.form = {
        title: target.title,
        author: target.author,
        content: target.content,
        isNotice: target.isNotice,
      };
      this.modal.show();
    },
    applyRowNumbers() {
      const maxNumber = this.notices
        .filter((notice) => Number.isInteger(notice.number))
        .reduce((max, current) => Math.max(max, current.number), 11729);

      let nextNumber = maxNumber;
      this.notices = this.notices.map((notice) => {
        if (notice.isNotice) {
          return { ...notice, number: null };
        }
        if (!Number.isInteger(notice.number)) {
          nextNumber += 1;
          return { ...notice, number: nextNumber };
        }
        return notice;
      });
    },
    saveNotice() {
      if (!this.form.title || !this.form.author || !this.form.content) {
        return;
      }

      if (this.editingId) {
        this.notices = this.notices.map((notice) =>
          notice.id === this.editingId
            ? {
                ...notice,
                title: this.form.title,
                author: this.form.author,
                content: this.form.content,
                isNotice: this.form.isNotice,
              }
            : notice
        );
      } else {
        this.notices.push({
          id: crypto.randomUUID(),
          isNotice: this.form.isNotice,
          number: null,
          title: this.form.title,
          author: this.form.author,
          content: this.form.content,
          createdAt: this.formatDate(new Date()),
          views: 0,
        });
      }

      this.applyRowNumbers();
      this.persist();
      this.currentPage = 1;
      this.modal.hide();
    },
    deleteNotice(id) {
      if (!window.confirm("이 공지사항을 삭제하시겠습니까?")) {
        return;
      }
      this.notices = this.notices.filter((notice) => notice.id !== id);
      this.applyRowNumbers();
      this.persist();
      this.selectedIds = this.selectedIds.filter((selectedId) => selectedId !== id);
    },
    deleteSelected() {
      if (this.selectedIds.length === 0) {
        window.alert("삭제할 공지사항을 선택해 주세요.");
        return;
      }
      if (!window.confirm(`선택한 ${this.selectedIds.length}건의 공지사항을 삭제하시겠습니까?`)) {
        return;
      }
      this.notices = this.notices.filter((notice) => !this.selectedIds.includes(notice.id));
      this.applyRowNumbers();
      this.persist();
      this.selectedIds = [];
      this.checkAll = false;
    },
    formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    },
  },
}).mount("#app");
