const R = require("ramda");
const moment = require("moment");

const formatSince = (since) => moment(since).fromNow();
const formatDate = (datePosted) => moment(datePosted).format("YYYY-MM-DD");
const formatDateTime = (datePosted) => moment(datePosted).format();
const isSameDay = (linkA, linkB) => formatDate(linkA) == formatDate(linkB);

//todo: reply in PM

module.exports = (links, {since, limitN, channel}) => html`
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Document</title>
      <style>
        body { font-family: monospace; }
      </style>
    </head>
    <body>
      <h1>
        clicks 4 u in ${channel}
        ${limitN ? safeHtml`(last ${limitN})`: ""}
        ${since ? safeHtml`(since ${formatSince(since)})`: ""}
      </h1>

      <button id="open-all">Open all</button>

      ${R.groupWith(isSameDay, links).map((day) => html`
        <section>
          <h2>${formatDate(links[0].datePosted)}</h2>
          <ol>
          ${links.map(({datePosted, title, nick, url}) => safeHtml`
            <li>
              <time>${formatDateTime(datePosted)}</time> -
              <span class="nick">${nick}</span> -
              <a class="link" href="${url}">${title || url}</a>
            </li>
          `)}
          </ol>
        </section>
      `)}

      <script>
        document.getElementById("open-all").onclick = function() {
          var els = document.getElementsByClassName("link");
          for (var i = 0; i < els.length; i++) {
            window.open(els[i].href, "_blank");
          }
        };
      </script>
    </body>
  </html>
`;
