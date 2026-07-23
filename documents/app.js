(function () {
  var input  = document.getElementById("doc-search");
  if (!input) return;

  var rows       = Array.prototype.slice.call(document.querySelectorAll(".doc-row"));
  var groups     = Array.prototype.slice.call(document.querySelectorAll(".doc-group"));
  var noResults  = document.getElementById("doc-no-results");

  input.addEventListener("input", function () {
    var q = input.value.trim().toLowerCase();

    rows.forEach(function (row) {
      var haystack = (row.dataset.search || "") + " " + row.textContent;
      var match = q === "" || haystack.toLowerCase().indexOf(q) !== -1;
      row.classList.toggle("doc-hidden", !match);
    });

    var anyGroupVisible = false;
    groups.forEach(function (group) {
      var anyVisible = group.querySelectorAll(".doc-row:not(.doc-hidden)").length > 0;
      group.classList.toggle("doc-group-hidden", !anyVisible);
      if (anyVisible) anyGroupVisible = true;
    });

    if (noResults) {
      noResults.classList.toggle("visible", q !== "" && !anyGroupVisible);
    }
  });
})();
