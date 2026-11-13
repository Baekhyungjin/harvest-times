/* 공개 조직도: 권한 부여나 계정 조회를 수행하지 않습니다. */
(function () {
  'use strict';
  function render() {
    var org = window.TN_ORG;
    if (!org) return; // HTML의 공개 명단을 그대로 유지합니다.
    var E = TN.esc;
    function officer(id, person) {
      var node = document.getElementById(id);
      if (!node || !person) return;
      node.innerHTML = E(person.name) + ' <span>' + E(person.title) + '</span>';
    }
    officer('org-publisher-name', org.publisher);
    officer('org-editor-name', org.editor);
    var grid = document.getElementById('org-departments');
    if (!grid || !Array.isArray(org.departments)) return;
    grid.innerHTML = org.departments.map(function (d, index) {
      return '<article class="org-card" id="org-' + E(d.code) + '">' +
        '<p class="org-index">' + String(index + 1).padStart(2, '0') + ' · 카테고리 책임자</p>' +
        '<h3>' + E(d.name) + '</h3><p class="org-lead">' + E(d.lead) + '</p>' +
        '<p class="org-duty">담당 분야의 원고를 검토하고 편집실과 협의합니다.</p></article>';
    }).join('');
  }
  if (!window.TNUI || typeof TNUI.boot !== 'function') return;
  TNUI.boot(null, function () {
    document.title = '조직도·편집위원 | 하베스트 타임스';
    render();
  });
})();
