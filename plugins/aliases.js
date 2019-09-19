const {stripIndent} = require("common-tags");
const R = require("ramda");
const {nicksMatch} = require("../lib/nicks");

const FILENAME = "aliases.json";

const parseNicksArg = (nicksRaw) => {
  return nicksRaw.trim().split(/\s+/);
};

const pred = R.curry(nicksMatch);

const addAliases = R.curry((newGroup, state) => R.pipe(
  R.defaultTo([]),
  R.append(newGroup),
  R.reduce(
    (result, nextGroup) => {
      const toMerge = R.groupBy(
        (candidateGroup) => R.innerJoin(pred, candidateGroup, nextGroup).length > 0,
        result
      );
      const merged = R.pipe(
        R.defaultTo([]),
        R.flatten,
        R.concat(nextGroup),
        R.uniqWith(pred)
      )(toMerge[true]);
      const distinct = R.defaultTo([], toMerge[false]);
      return R.append(
        merged,
        distinct
      );
    },
    []
  )
)(state));

const findAliases = R.curry((nick, state) => R.pipe(
  R.defaultTo([]),
  R.find(R.find(pred(nick))),
  R.defaultTo([nick])
)(state));

const deleteAliases = R.curry((nick, state) => R.pipe(
  R.defaultTo([]),
  R.reject(R.find(pred(nick)))
)(state));

const countAliases = (state) => R.pipe(
  R.defaultTo([]),
  R.flatten,
  R.length
)(state);

module.exports = (s3Store, {help, match, style, use}) => {
  const getState = (...args) => s3Store.getState(FILENAME, ...args);
  const saveState = (...args) => s3Store.saveState(FILENAME, ...args);
  const doUpdate = (update, cb) => {
    getState((err, oldState) => {
      if (err) return cb(err);
      const newState = update(oldState);
      saveState(newState, (err) => {
        cb(err ? err : null, oldState, newState);
      });
    });
  };

  help("aliases", stripIndent`
    Allows users to save a list of nicks they use in IRC. They are used by other plugins like ${style.em("tell")}.
    ${style.em("!im <nick> <nick> ...")}: Links the given nicks, ${style.strong("and your current nick")}, as the same user.
    ${style.em("!who [nick]")}: Shows all known aliases of yourself or the given nick.
    ${style.em("!add-aliases <nick> <nick> ...")}: Similar to ${style.em("!im")}, but doesn't include your current nick. Useful for setting up aliases for someone else.
    ${style.em("!del-aliases <nick>")}: Removes the alias group containing <nick>. Useful if two groups are accidentally joined and need to be recreated separately with ${style.em("!add-aliases")}.
  `);

  match(/^!im(?:\s+(.+))?$/i, ({reply, nick}, [nicksArg]) => {
    const nicks = [nick, ...parseNicksArg(style.clear(nicksArg))];
    doUpdate(addAliases(nicks), (err, oldState, newState) => {
      if (err) {
        console.error(err);
        return reply(style.strong("Failed to update state"));
      }
      const diff = countAliases(newState) - countAliases(oldState);
      reply(diff > 0 ? `Added ${diff} nick(s)` : "I know");
    });
  });

  match(/^!add-aliases\s+(.+)$/i, ({reply, nick}, [nicksArg]) => {
    const nicks = parseNicksArg(style.clear(nicksArg));
    doUpdate(addAliases(nicks), (err, oldState, newState) => {
      if (err) {
        console.error(err);
        return reply(style.strong("Failed to update state"));
      }
      const diff = countAliases(newState) - countAliases(oldState);
      reply(diff > 0 ? `Added ${diff} nick(s)` : "No change");
    });
  });

  match(/^!del-aliases\s+(.+)$/i, ({reply}, [nickArg]) => {
    doUpdate(deleteAliases(nickArg), (err, oldState, newState) => {
      if (err) {
        console.error(err);
        return reply(style.strong("Failed to update state"));
      }
      const diff = countAliases(oldState) - countAliases(newState);
      const removed = findAliases(nickArg, oldState);
      reply(diff > 0 ? `Removed ${diff} nick(s): ${removed.map(style.nick).join(" ")}` : "No change");
    });
  });

  match(/^!who(?:\s+(\S+))?\s*$/i, ({reply, nick}, [nickArg]) => {
    const query = style.clear(nickArg || nick);
    getState((err, state) => {
      if (err) {
        console.error(err);
        return reply(style.strong("Failed to get state"));
      }
      const aliases = findAliases(query, state);
      if (aliases.length > 1) {
        reply(aliases.map(style.nick).join(" "));
      } else {
        reply(`I don't know any other aliases for ${style.nick(query)}`)
      }
    });
  });

  use((next, ctx) => {
    getState((err, state) => {
      if (err) {
        console.error("Failed to add aliases to context");
        next(ctx);
      } else {
        const aliases = findAliases(ctx.nick, state);
        next({
          ...ctx,
          aliases,
          isAlias: (nick) => R.find(pred(nick), aliases) != undefined
        });
      }
    });
  });
};
