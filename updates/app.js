(function () {
  const TYPE_LABELS = {
    clinical: "Clinical content",
    governance: "Governance",
    interface: "Interface"
  };

  const list = document.getElementById("updates-list");
  const summary = document.getElementById("updates-summary");

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function formattedDate(value) {
    const date = new Date(`${value}T12:00:00Z`);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric", month: "long", day: "numeric", timeZone: "UTC"
    }).format(date);
  }

  function detailRow(label, items) {
    const row = element("div", "update-detail");
    row.append(element("span", "update-detail__label", label));
    const values = element("div", "update-detail__items");
    items.forEach((item) => values.append(item));
    row.append(values);
    return row;
  }

  function renderEntry(entry, tools, sources) {
    const article = element("article", "update-card");
    article.dataset.type = entry.type;
    article.setAttribute("aria-labelledby", `update-${entry.id}`);

    const meta = element("div", "update-card__meta");
    const time = element("time", "update-card__date", formattedDate(entry.date));
    time.dateTime = entry.date;
    meta.append(time, element("span", "update-card__badge", TYPE_LABELS[entry.type] || entry.type));
    if (entry.scope) meta.append(element("span", "update-card__scope", entry.scope));

    const title = element("h3", "", entry.title);
    title.id = `update-${entry.id}`;
    article.append(meta, title, element("p", "update-card__summary", entry.summary));

    const changes = element("ul", "update-card__changes");
    entry.changes.forEach((change) => changes.append(element("li", "", change)));
    article.append(changes);

    const details = element("div", "update-card__details");
    const routeLinks = entry.affected_routes.map((route) => {
      const link = element("a", "", tools.get(route) || route);
      link.href = route;
      return link;
    });
    if (routeLinks.length) details.append(detailRow("Affected tools", routeLinks));

    const sourceLinks = entry.source_ids.map((id) => sources[id]).filter(Boolean).map((source) => {
      const link = element("a", "", source.title);
      link.href = source.url;
      link.target = "_blank";
      link.rel = "noopener";
      return link;
    });
    if (sourceLinks.length) details.append(detailRow("Sources reviewed", sourceLinks));

    if (entry.commit) {
      const link = element("a", "update-commit", entry.commit);
      link.href = `https://github.com/jamjop/noahpac-portal/commit/${entry.commit}`;
      link.target = "_blank";
      link.rel = "noopener";
      details.append(detailRow("Release record", [link]));
    }
    if (details.childElementCount) article.append(details);
    return article;
  }

  async function initialize() {
    try {
      const [changelogResponse, reviewResponse] = await Promise.all([
        fetch("/clinical-changelog.json", { cache: "no-store" }),
        fetch("/clinical-review.json", { cache: "no-store" })
      ]);
      if (!changelogResponse.ok) throw new Error("Update record unavailable");
      const changelog = await changelogResponse.json();
      const review = reviewResponse.ok ? await reviewResponse.json() : { tools: [], sources: {} };
      const tools = new Map((review.tools || []).map((tool) => [tool.path, tool.title]));
      const entries = [...(changelog.entries || [])].sort((a, b) => b.date.localeCompare(a.date));
      if (!entries.length) throw new Error("Update record is empty");

      list.replaceChildren(...entries.map((entry) => renderEntry(entry, tools, review.sources || {})));
      summary.textContent = `${entries.length} substantive updates recorded`;
    } catch (_) {
      summary.textContent = "Update record unavailable";
      const error = element("p", "updates-error");
      error.append("The update record could not be loaded. You can view the ");
      const link = element("a", "", "structured record directly");
      link.href = "/clinical-changelog.json";
      error.append(link, ".");
      list.replaceChildren(error);
    }
  }

  initialize();
})();
