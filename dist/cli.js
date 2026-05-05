#!/usr/bin/env bun
// @bun
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
function __accessProp(key) {
  return this[key];
}
var __toESMCache_node;
var __toESMCache_esm;
var __toESM = (mod, isNodeMode, target) => {
  var canCache = mod != null && typeof mod === "object";
  if (canCache) {
    var cache = isNodeMode ? __toESMCache_node ??= new WeakMap : __toESMCache_esm ??= new WeakMap;
    var cached = cache.get(mod);
    if (cached)
      return cached;
  }
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: __accessProp.bind(mod, key),
        enumerable: true
      });
  if (canCache)
    cache.set(mod, to);
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __require = import.meta.require;

// node_modules/commander/lib/error.js
var require_error = __commonJS((exports) => {
  class CommanderError extends Error {
    constructor(exitCode, code, message) {
      super(message);
      Error.captureStackTrace(this, this.constructor);
      this.name = this.constructor.name;
      this.code = code;
      this.exitCode = exitCode;
      this.nestedError = undefined;
    }
  }

  class InvalidArgumentError extends CommanderError {
    constructor(message) {
      super(1, "commander.invalidArgument", message);
      Error.captureStackTrace(this, this.constructor);
      this.name = this.constructor.name;
    }
  }
  exports.CommanderError = CommanderError;
  exports.InvalidArgumentError = InvalidArgumentError;
});

// node_modules/commander/lib/argument.js
var require_argument = __commonJS((exports) => {
  var { InvalidArgumentError } = require_error();

  class Argument {
    constructor(name, description) {
      this.description = description || "";
      this.variadic = false;
      this.parseArg = undefined;
      this.defaultValue = undefined;
      this.defaultValueDescription = undefined;
      this.argChoices = undefined;
      switch (name[0]) {
        case "<":
          this.required = true;
          this._name = name.slice(1, -1);
          break;
        case "[":
          this.required = false;
          this._name = name.slice(1, -1);
          break;
        default:
          this.required = true;
          this._name = name;
          break;
      }
      if (this._name.length > 3 && this._name.slice(-3) === "...") {
        this.variadic = true;
        this._name = this._name.slice(0, -3);
      }
    }
    name() {
      return this._name;
    }
    _concatValue(value, previous) {
      if (previous === this.defaultValue || !Array.isArray(previous)) {
        return [value];
      }
      return previous.concat(value);
    }
    default(value, description) {
      this.defaultValue = value;
      this.defaultValueDescription = description;
      return this;
    }
    argParser(fn) {
      this.parseArg = fn;
      return this;
    }
    choices(values) {
      this.argChoices = values.slice();
      this.parseArg = (arg, previous) => {
        if (!this.argChoices.includes(arg)) {
          throw new InvalidArgumentError(`Allowed choices are ${this.argChoices.join(", ")}.`);
        }
        if (this.variadic) {
          return this._concatValue(arg, previous);
        }
        return arg;
      };
      return this;
    }
    argRequired() {
      this.required = true;
      return this;
    }
    argOptional() {
      this.required = false;
      return this;
    }
  }
  function humanReadableArgName(arg) {
    const nameOutput = arg.name() + (arg.variadic === true ? "..." : "");
    return arg.required ? "<" + nameOutput + ">" : "[" + nameOutput + "]";
  }
  exports.Argument = Argument;
  exports.humanReadableArgName = humanReadableArgName;
});

// node_modules/commander/lib/help.js
var require_help = __commonJS((exports) => {
  var { humanReadableArgName } = require_argument();

  class Help {
    constructor() {
      this.helpWidth = undefined;
      this.sortSubcommands = false;
      this.sortOptions = false;
      this.showGlobalOptions = false;
    }
    visibleCommands(cmd) {
      const visibleCommands = cmd.commands.filter((cmd2) => !cmd2._hidden);
      const helpCommand = cmd._getHelpCommand();
      if (helpCommand && !helpCommand._hidden) {
        visibleCommands.push(helpCommand);
      }
      if (this.sortSubcommands) {
        visibleCommands.sort((a, b) => {
          return a.name().localeCompare(b.name());
        });
      }
      return visibleCommands;
    }
    compareOptions(a, b) {
      const getSortKey = (option) => {
        return option.short ? option.short.replace(/^-/, "") : option.long.replace(/^--/, "");
      };
      return getSortKey(a).localeCompare(getSortKey(b));
    }
    visibleOptions(cmd) {
      const visibleOptions = cmd.options.filter((option) => !option.hidden);
      const helpOption = cmd._getHelpOption();
      if (helpOption && !helpOption.hidden) {
        const removeShort = helpOption.short && cmd._findOption(helpOption.short);
        const removeLong = helpOption.long && cmd._findOption(helpOption.long);
        if (!removeShort && !removeLong) {
          visibleOptions.push(helpOption);
        } else if (helpOption.long && !removeLong) {
          visibleOptions.push(cmd.createOption(helpOption.long, helpOption.description));
        } else if (helpOption.short && !removeShort) {
          visibleOptions.push(cmd.createOption(helpOption.short, helpOption.description));
        }
      }
      if (this.sortOptions) {
        visibleOptions.sort(this.compareOptions);
      }
      return visibleOptions;
    }
    visibleGlobalOptions(cmd) {
      if (!this.showGlobalOptions)
        return [];
      const globalOptions = [];
      for (let ancestorCmd = cmd.parent;ancestorCmd; ancestorCmd = ancestorCmd.parent) {
        const visibleOptions = ancestorCmd.options.filter((option) => !option.hidden);
        globalOptions.push(...visibleOptions);
      }
      if (this.sortOptions) {
        globalOptions.sort(this.compareOptions);
      }
      return globalOptions;
    }
    visibleArguments(cmd) {
      if (cmd._argsDescription) {
        cmd.registeredArguments.forEach((argument) => {
          argument.description = argument.description || cmd._argsDescription[argument.name()] || "";
        });
      }
      if (cmd.registeredArguments.find((argument) => argument.description)) {
        return cmd.registeredArguments;
      }
      return [];
    }
    subcommandTerm(cmd) {
      const args = cmd.registeredArguments.map((arg) => humanReadableArgName(arg)).join(" ");
      return cmd._name + (cmd._aliases[0] ? "|" + cmd._aliases[0] : "") + (cmd.options.length ? " [options]" : "") + (args ? " " + args : "");
    }
    optionTerm(option) {
      return option.flags;
    }
    argumentTerm(argument) {
      return argument.name();
    }
    longestSubcommandTermLength(cmd, helper) {
      return helper.visibleCommands(cmd).reduce((max, command) => {
        return Math.max(max, helper.subcommandTerm(command).length);
      }, 0);
    }
    longestOptionTermLength(cmd, helper) {
      return helper.visibleOptions(cmd).reduce((max, option) => {
        return Math.max(max, helper.optionTerm(option).length);
      }, 0);
    }
    longestGlobalOptionTermLength(cmd, helper) {
      return helper.visibleGlobalOptions(cmd).reduce((max, option) => {
        return Math.max(max, helper.optionTerm(option).length);
      }, 0);
    }
    longestArgumentTermLength(cmd, helper) {
      return helper.visibleArguments(cmd).reduce((max, argument) => {
        return Math.max(max, helper.argumentTerm(argument).length);
      }, 0);
    }
    commandUsage(cmd) {
      let cmdName = cmd._name;
      if (cmd._aliases[0]) {
        cmdName = cmdName + "|" + cmd._aliases[0];
      }
      let ancestorCmdNames = "";
      for (let ancestorCmd = cmd.parent;ancestorCmd; ancestorCmd = ancestorCmd.parent) {
        ancestorCmdNames = ancestorCmd.name() + " " + ancestorCmdNames;
      }
      return ancestorCmdNames + cmdName + " " + cmd.usage();
    }
    commandDescription(cmd) {
      return cmd.description();
    }
    subcommandDescription(cmd) {
      return cmd.summary() || cmd.description();
    }
    optionDescription(option) {
      const extraInfo = [];
      if (option.argChoices) {
        extraInfo.push(`choices: ${option.argChoices.map((choice) => JSON.stringify(choice)).join(", ")}`);
      }
      if (option.defaultValue !== undefined) {
        const showDefault = option.required || option.optional || option.isBoolean() && typeof option.defaultValue === "boolean";
        if (showDefault) {
          extraInfo.push(`default: ${option.defaultValueDescription || JSON.stringify(option.defaultValue)}`);
        }
      }
      if (option.presetArg !== undefined && option.optional) {
        extraInfo.push(`preset: ${JSON.stringify(option.presetArg)}`);
      }
      if (option.envVar !== undefined) {
        extraInfo.push(`env: ${option.envVar}`);
      }
      if (extraInfo.length > 0) {
        return `${option.description} (${extraInfo.join(", ")})`;
      }
      return option.description;
    }
    argumentDescription(argument) {
      const extraInfo = [];
      if (argument.argChoices) {
        extraInfo.push(`choices: ${argument.argChoices.map((choice) => JSON.stringify(choice)).join(", ")}`);
      }
      if (argument.defaultValue !== undefined) {
        extraInfo.push(`default: ${argument.defaultValueDescription || JSON.stringify(argument.defaultValue)}`);
      }
      if (extraInfo.length > 0) {
        const extraDescripton = `(${extraInfo.join(", ")})`;
        if (argument.description) {
          return `${argument.description} ${extraDescripton}`;
        }
        return extraDescripton;
      }
      return argument.description;
    }
    formatHelp(cmd, helper) {
      const termWidth = helper.padWidth(cmd, helper);
      const helpWidth = helper.helpWidth || 80;
      const itemIndentWidth = 2;
      const itemSeparatorWidth = 2;
      function formatItem(term, description) {
        if (description) {
          const fullText = `${term.padEnd(termWidth + itemSeparatorWidth)}${description}`;
          return helper.wrap(fullText, helpWidth - itemIndentWidth, termWidth + itemSeparatorWidth);
        }
        return term;
      }
      function formatList(textArray) {
        return textArray.join(`
`).replace(/^/gm, " ".repeat(itemIndentWidth));
      }
      let output = [`Usage: ${helper.commandUsage(cmd)}`, ""];
      const commandDescription = helper.commandDescription(cmd);
      if (commandDescription.length > 0) {
        output = output.concat([
          helper.wrap(commandDescription, helpWidth, 0),
          ""
        ]);
      }
      const argumentList = helper.visibleArguments(cmd).map((argument) => {
        return formatItem(helper.argumentTerm(argument), helper.argumentDescription(argument));
      });
      if (argumentList.length > 0) {
        output = output.concat(["Arguments:", formatList(argumentList), ""]);
      }
      const optionList = helper.visibleOptions(cmd).map((option) => {
        return formatItem(helper.optionTerm(option), helper.optionDescription(option));
      });
      if (optionList.length > 0) {
        output = output.concat(["Options:", formatList(optionList), ""]);
      }
      if (this.showGlobalOptions) {
        const globalOptionList = helper.visibleGlobalOptions(cmd).map((option) => {
          return formatItem(helper.optionTerm(option), helper.optionDescription(option));
        });
        if (globalOptionList.length > 0) {
          output = output.concat([
            "Global Options:",
            formatList(globalOptionList),
            ""
          ]);
        }
      }
      const commandList = helper.visibleCommands(cmd).map((cmd2) => {
        return formatItem(helper.subcommandTerm(cmd2), helper.subcommandDescription(cmd2));
      });
      if (commandList.length > 0) {
        output = output.concat(["Commands:", formatList(commandList), ""]);
      }
      return output.join(`
`);
    }
    padWidth(cmd, helper) {
      return Math.max(helper.longestOptionTermLength(cmd, helper), helper.longestGlobalOptionTermLength(cmd, helper), helper.longestSubcommandTermLength(cmd, helper), helper.longestArgumentTermLength(cmd, helper));
    }
    wrap(str, width, indent, minColumnWidth = 40) {
      const indents = " \\f\\t\\v\xA0\u1680\u2000-\u200A\u202F\u205F\u3000\uFEFF";
      const manualIndent = new RegExp(`[\\n][${indents}]+`);
      if (str.match(manualIndent))
        return str;
      const columnWidth = width - indent;
      if (columnWidth < minColumnWidth)
        return str;
      const leadingStr = str.slice(0, indent);
      const columnText = str.slice(indent).replace(`\r
`, `
`);
      const indentString = " ".repeat(indent);
      const zeroWidthSpace = "\u200B";
      const breaks = `\\s${zeroWidthSpace}`;
      const regex = new RegExp(`
|.{1,${columnWidth - 1}}([${breaks}]|$)|[^${breaks}]+?([${breaks}]|$)`, "g");
      const lines = columnText.match(regex) || [];
      return leadingStr + lines.map((line, i) => {
        if (line === `
`)
          return "";
        return (i > 0 ? indentString : "") + line.trimEnd();
      }).join(`
`);
    }
  }
  exports.Help = Help;
});

// node_modules/commander/lib/option.js
var require_option = __commonJS((exports) => {
  var { InvalidArgumentError } = require_error();

  class Option {
    constructor(flags, description) {
      this.flags = flags;
      this.description = description || "";
      this.required = flags.includes("<");
      this.optional = flags.includes("[");
      this.variadic = /\w\.\.\.[>\]]$/.test(flags);
      this.mandatory = false;
      const optionFlags = splitOptionFlags(flags);
      this.short = optionFlags.shortFlag;
      this.long = optionFlags.longFlag;
      this.negate = false;
      if (this.long) {
        this.negate = this.long.startsWith("--no-");
      }
      this.defaultValue = undefined;
      this.defaultValueDescription = undefined;
      this.presetArg = undefined;
      this.envVar = undefined;
      this.parseArg = undefined;
      this.hidden = false;
      this.argChoices = undefined;
      this.conflictsWith = [];
      this.implied = undefined;
    }
    default(value, description) {
      this.defaultValue = value;
      this.defaultValueDescription = description;
      return this;
    }
    preset(arg) {
      this.presetArg = arg;
      return this;
    }
    conflicts(names) {
      this.conflictsWith = this.conflictsWith.concat(names);
      return this;
    }
    implies(impliedOptionValues) {
      let newImplied = impliedOptionValues;
      if (typeof impliedOptionValues === "string") {
        newImplied = { [impliedOptionValues]: true };
      }
      this.implied = Object.assign(this.implied || {}, newImplied);
      return this;
    }
    env(name) {
      this.envVar = name;
      return this;
    }
    argParser(fn) {
      this.parseArg = fn;
      return this;
    }
    makeOptionMandatory(mandatory = true) {
      this.mandatory = !!mandatory;
      return this;
    }
    hideHelp(hide = true) {
      this.hidden = !!hide;
      return this;
    }
    _concatValue(value, previous) {
      if (previous === this.defaultValue || !Array.isArray(previous)) {
        return [value];
      }
      return previous.concat(value);
    }
    choices(values) {
      this.argChoices = values.slice();
      this.parseArg = (arg, previous) => {
        if (!this.argChoices.includes(arg)) {
          throw new InvalidArgumentError(`Allowed choices are ${this.argChoices.join(", ")}.`);
        }
        if (this.variadic) {
          return this._concatValue(arg, previous);
        }
        return arg;
      };
      return this;
    }
    name() {
      if (this.long) {
        return this.long.replace(/^--/, "");
      }
      return this.short.replace(/^-/, "");
    }
    attributeName() {
      return camelcase(this.name().replace(/^no-/, ""));
    }
    is(arg) {
      return this.short === arg || this.long === arg;
    }
    isBoolean() {
      return !this.required && !this.optional && !this.negate;
    }
  }

  class DualOptions {
    constructor(options) {
      this.positiveOptions = new Map;
      this.negativeOptions = new Map;
      this.dualOptions = new Set;
      options.forEach((option) => {
        if (option.negate) {
          this.negativeOptions.set(option.attributeName(), option);
        } else {
          this.positiveOptions.set(option.attributeName(), option);
        }
      });
      this.negativeOptions.forEach((value, key) => {
        if (this.positiveOptions.has(key)) {
          this.dualOptions.add(key);
        }
      });
    }
    valueFromOption(value, option) {
      const optionKey = option.attributeName();
      if (!this.dualOptions.has(optionKey))
        return true;
      const preset = this.negativeOptions.get(optionKey).presetArg;
      const negativeValue = preset !== undefined ? preset : false;
      return option.negate === (negativeValue === value);
    }
  }
  function camelcase(str) {
    return str.split("-").reduce((str2, word) => {
      return str2 + word[0].toUpperCase() + word.slice(1);
    });
  }
  function splitOptionFlags(flags) {
    let shortFlag;
    let longFlag;
    const flagParts = flags.split(/[ |,]+/);
    if (flagParts.length > 1 && !/^[[<]/.test(flagParts[1]))
      shortFlag = flagParts.shift();
    longFlag = flagParts.shift();
    if (!shortFlag && /^-[^-]$/.test(longFlag)) {
      shortFlag = longFlag;
      longFlag = undefined;
    }
    return { shortFlag, longFlag };
  }
  exports.Option = Option;
  exports.DualOptions = DualOptions;
});

// node_modules/commander/lib/suggestSimilar.js
var require_suggestSimilar = __commonJS((exports) => {
  var maxDistance = 3;
  function editDistance(a, b) {
    if (Math.abs(a.length - b.length) > maxDistance)
      return Math.max(a.length, b.length);
    const d = [];
    for (let i = 0;i <= a.length; i++) {
      d[i] = [i];
    }
    for (let j = 0;j <= b.length; j++) {
      d[0][j] = j;
    }
    for (let j = 1;j <= b.length; j++) {
      for (let i = 1;i <= a.length; i++) {
        let cost = 1;
        if (a[i - 1] === b[j - 1]) {
          cost = 0;
        } else {
          cost = 1;
        }
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        }
      }
    }
    return d[a.length][b.length];
  }
  function suggestSimilar(word, candidates) {
    if (!candidates || candidates.length === 0)
      return "";
    candidates = Array.from(new Set(candidates));
    const searchingOptions = word.startsWith("--");
    if (searchingOptions) {
      word = word.slice(2);
      candidates = candidates.map((candidate) => candidate.slice(2));
    }
    let similar = [];
    let bestDistance = maxDistance;
    const minSimilarity = 0.4;
    candidates.forEach((candidate) => {
      if (candidate.length <= 1)
        return;
      const distance = editDistance(word, candidate);
      const length = Math.max(word.length, candidate.length);
      const similarity = (length - distance) / length;
      if (similarity > minSimilarity) {
        if (distance < bestDistance) {
          bestDistance = distance;
          similar = [candidate];
        } else if (distance === bestDistance) {
          similar.push(candidate);
        }
      }
    });
    similar.sort((a, b) => a.localeCompare(b));
    if (searchingOptions) {
      similar = similar.map((candidate) => `--${candidate}`);
    }
    if (similar.length > 1) {
      return `
(Did you mean one of ${similar.join(", ")}?)`;
    }
    if (similar.length === 1) {
      return `
(Did you mean ${similar[0]}?)`;
    }
    return "";
  }
  exports.suggestSimilar = suggestSimilar;
});

// node_modules/commander/lib/command.js
var require_command = __commonJS((exports) => {
  var EventEmitter = __require("events").EventEmitter;
  var childProcess = __require("child_process");
  var path = __require("path");
  var fs = __require("fs");
  var process2 = __require("process");
  var { Argument, humanReadableArgName } = require_argument();
  var { CommanderError } = require_error();
  var { Help } = require_help();
  var { Option, DualOptions } = require_option();
  var { suggestSimilar } = require_suggestSimilar();

  class Command extends EventEmitter {
    constructor(name) {
      super();
      this.commands = [];
      this.options = [];
      this.parent = null;
      this._allowUnknownOption = false;
      this._allowExcessArguments = true;
      this.registeredArguments = [];
      this._args = this.registeredArguments;
      this.args = [];
      this.rawArgs = [];
      this.processedArgs = [];
      this._scriptPath = null;
      this._name = name || "";
      this._optionValues = {};
      this._optionValueSources = {};
      this._storeOptionsAsProperties = false;
      this._actionHandler = null;
      this._executableHandler = false;
      this._executableFile = null;
      this._executableDir = null;
      this._defaultCommandName = null;
      this._exitCallback = null;
      this._aliases = [];
      this._combineFlagAndOptionalValue = true;
      this._description = "";
      this._summary = "";
      this._argsDescription = undefined;
      this._enablePositionalOptions = false;
      this._passThroughOptions = false;
      this._lifeCycleHooks = {};
      this._showHelpAfterError = false;
      this._showSuggestionAfterError = true;
      this._outputConfiguration = {
        writeOut: (str) => process2.stdout.write(str),
        writeErr: (str) => process2.stderr.write(str),
        getOutHelpWidth: () => process2.stdout.isTTY ? process2.stdout.columns : undefined,
        getErrHelpWidth: () => process2.stderr.isTTY ? process2.stderr.columns : undefined,
        outputError: (str, write) => write(str)
      };
      this._hidden = false;
      this._helpOption = undefined;
      this._addImplicitHelpCommand = undefined;
      this._helpCommand = undefined;
      this._helpConfiguration = {};
    }
    copyInheritedSettings(sourceCommand) {
      this._outputConfiguration = sourceCommand._outputConfiguration;
      this._helpOption = sourceCommand._helpOption;
      this._helpCommand = sourceCommand._helpCommand;
      this._helpConfiguration = sourceCommand._helpConfiguration;
      this._exitCallback = sourceCommand._exitCallback;
      this._storeOptionsAsProperties = sourceCommand._storeOptionsAsProperties;
      this._combineFlagAndOptionalValue = sourceCommand._combineFlagAndOptionalValue;
      this._allowExcessArguments = sourceCommand._allowExcessArguments;
      this._enablePositionalOptions = sourceCommand._enablePositionalOptions;
      this._showHelpAfterError = sourceCommand._showHelpAfterError;
      this._showSuggestionAfterError = sourceCommand._showSuggestionAfterError;
      return this;
    }
    _getCommandAndAncestors() {
      const result = [];
      for (let command = this;command; command = command.parent) {
        result.push(command);
      }
      return result;
    }
    command(nameAndArgs, actionOptsOrExecDesc, execOpts) {
      let desc = actionOptsOrExecDesc;
      let opts = execOpts;
      if (typeof desc === "object" && desc !== null) {
        opts = desc;
        desc = null;
      }
      opts = opts || {};
      const [, name, args] = nameAndArgs.match(/([^ ]+) *(.*)/);
      const cmd = this.createCommand(name);
      if (desc) {
        cmd.description(desc);
        cmd._executableHandler = true;
      }
      if (opts.isDefault)
        this._defaultCommandName = cmd._name;
      cmd._hidden = !!(opts.noHelp || opts.hidden);
      cmd._executableFile = opts.executableFile || null;
      if (args)
        cmd.arguments(args);
      this._registerCommand(cmd);
      cmd.parent = this;
      cmd.copyInheritedSettings(this);
      if (desc)
        return this;
      return cmd;
    }
    createCommand(name) {
      return new Command(name);
    }
    createHelp() {
      return Object.assign(new Help, this.configureHelp());
    }
    configureHelp(configuration) {
      if (configuration === undefined)
        return this._helpConfiguration;
      this._helpConfiguration = configuration;
      return this;
    }
    configureOutput(configuration) {
      if (configuration === undefined)
        return this._outputConfiguration;
      Object.assign(this._outputConfiguration, configuration);
      return this;
    }
    showHelpAfterError(displayHelp = true) {
      if (typeof displayHelp !== "string")
        displayHelp = !!displayHelp;
      this._showHelpAfterError = displayHelp;
      return this;
    }
    showSuggestionAfterError(displaySuggestion = true) {
      this._showSuggestionAfterError = !!displaySuggestion;
      return this;
    }
    addCommand(cmd, opts) {
      if (!cmd._name) {
        throw new Error(`Command passed to .addCommand() must have a name
- specify the name in Command constructor or using .name()`);
      }
      opts = opts || {};
      if (opts.isDefault)
        this._defaultCommandName = cmd._name;
      if (opts.noHelp || opts.hidden)
        cmd._hidden = true;
      this._registerCommand(cmd);
      cmd.parent = this;
      cmd._checkForBrokenPassThrough();
      return this;
    }
    createArgument(name, description) {
      return new Argument(name, description);
    }
    argument(name, description, fn, defaultValue) {
      const argument = this.createArgument(name, description);
      if (typeof fn === "function") {
        argument.default(defaultValue).argParser(fn);
      } else {
        argument.default(fn);
      }
      this.addArgument(argument);
      return this;
    }
    arguments(names) {
      names.trim().split(/ +/).forEach((detail) => {
        this.argument(detail);
      });
      return this;
    }
    addArgument(argument) {
      const previousArgument = this.registeredArguments.slice(-1)[0];
      if (previousArgument && previousArgument.variadic) {
        throw new Error(`only the last argument can be variadic '${previousArgument.name()}'`);
      }
      if (argument.required && argument.defaultValue !== undefined && argument.parseArg === undefined) {
        throw new Error(`a default value for a required argument is never used: '${argument.name()}'`);
      }
      this.registeredArguments.push(argument);
      return this;
    }
    helpCommand(enableOrNameAndArgs, description) {
      if (typeof enableOrNameAndArgs === "boolean") {
        this._addImplicitHelpCommand = enableOrNameAndArgs;
        return this;
      }
      enableOrNameAndArgs = enableOrNameAndArgs ?? "help [command]";
      const [, helpName, helpArgs] = enableOrNameAndArgs.match(/([^ ]+) *(.*)/);
      const helpDescription = description ?? "display help for command";
      const helpCommand = this.createCommand(helpName);
      helpCommand.helpOption(false);
      if (helpArgs)
        helpCommand.arguments(helpArgs);
      if (helpDescription)
        helpCommand.description(helpDescription);
      this._addImplicitHelpCommand = true;
      this._helpCommand = helpCommand;
      return this;
    }
    addHelpCommand(helpCommand, deprecatedDescription) {
      if (typeof helpCommand !== "object") {
        this.helpCommand(helpCommand, deprecatedDescription);
        return this;
      }
      this._addImplicitHelpCommand = true;
      this._helpCommand = helpCommand;
      return this;
    }
    _getHelpCommand() {
      const hasImplicitHelpCommand = this._addImplicitHelpCommand ?? (this.commands.length && !this._actionHandler && !this._findCommand("help"));
      if (hasImplicitHelpCommand) {
        if (this._helpCommand === undefined) {
          this.helpCommand(undefined, undefined);
        }
        return this._helpCommand;
      }
      return null;
    }
    hook(event, listener) {
      const allowedValues = ["preSubcommand", "preAction", "postAction"];
      if (!allowedValues.includes(event)) {
        throw new Error(`Unexpected value for event passed to hook : '${event}'.
Expecting one of '${allowedValues.join("', '")}'`);
      }
      if (this._lifeCycleHooks[event]) {
        this._lifeCycleHooks[event].push(listener);
      } else {
        this._lifeCycleHooks[event] = [listener];
      }
      return this;
    }
    exitOverride(fn) {
      if (fn) {
        this._exitCallback = fn;
      } else {
        this._exitCallback = (err) => {
          if (err.code !== "commander.executeSubCommandAsync") {
            throw err;
          } else {}
        };
      }
      return this;
    }
    _exit(exitCode, code, message) {
      if (this._exitCallback) {
        this._exitCallback(new CommanderError(exitCode, code, message));
      }
      process2.exit(exitCode);
    }
    action(fn) {
      const listener = (args) => {
        const expectedArgsCount = this.registeredArguments.length;
        const actionArgs = args.slice(0, expectedArgsCount);
        if (this._storeOptionsAsProperties) {
          actionArgs[expectedArgsCount] = this;
        } else {
          actionArgs[expectedArgsCount] = this.opts();
        }
        actionArgs.push(this);
        return fn.apply(this, actionArgs);
      };
      this._actionHandler = listener;
      return this;
    }
    createOption(flags, description) {
      return new Option(flags, description);
    }
    _callParseArg(target, value, previous, invalidArgumentMessage) {
      try {
        return target.parseArg(value, previous);
      } catch (err) {
        if (err.code === "commander.invalidArgument") {
          const message = `${invalidArgumentMessage} ${err.message}`;
          this.error(message, { exitCode: err.exitCode, code: err.code });
        }
        throw err;
      }
    }
    _registerOption(option) {
      const matchingOption = option.short && this._findOption(option.short) || option.long && this._findOption(option.long);
      if (matchingOption) {
        const matchingFlag = option.long && this._findOption(option.long) ? option.long : option.short;
        throw new Error(`Cannot add option '${option.flags}'${this._name && ` to command '${this._name}'`} due to conflicting flag '${matchingFlag}'
-  already used by option '${matchingOption.flags}'`);
      }
      this.options.push(option);
    }
    _registerCommand(command) {
      const knownBy = (cmd) => {
        return [cmd.name()].concat(cmd.aliases());
      };
      const alreadyUsed = knownBy(command).find((name) => this._findCommand(name));
      if (alreadyUsed) {
        const existingCmd = knownBy(this._findCommand(alreadyUsed)).join("|");
        const newCmd = knownBy(command).join("|");
        throw new Error(`cannot add command '${newCmd}' as already have command '${existingCmd}'`);
      }
      this.commands.push(command);
    }
    addOption(option) {
      this._registerOption(option);
      const oname = option.name();
      const name = option.attributeName();
      if (option.negate) {
        const positiveLongFlag = option.long.replace(/^--no-/, "--");
        if (!this._findOption(positiveLongFlag)) {
          this.setOptionValueWithSource(name, option.defaultValue === undefined ? true : option.defaultValue, "default");
        }
      } else if (option.defaultValue !== undefined) {
        this.setOptionValueWithSource(name, option.defaultValue, "default");
      }
      const handleOptionValue = (val, invalidValueMessage, valueSource) => {
        if (val == null && option.presetArg !== undefined) {
          val = option.presetArg;
        }
        const oldValue = this.getOptionValue(name);
        if (val !== null && option.parseArg) {
          val = this._callParseArg(option, val, oldValue, invalidValueMessage);
        } else if (val !== null && option.variadic) {
          val = option._concatValue(val, oldValue);
        }
        if (val == null) {
          if (option.negate) {
            val = false;
          } else if (option.isBoolean() || option.optional) {
            val = true;
          } else {
            val = "";
          }
        }
        this.setOptionValueWithSource(name, val, valueSource);
      };
      this.on("option:" + oname, (val) => {
        const invalidValueMessage = `error: option '${option.flags}' argument '${val}' is invalid.`;
        handleOptionValue(val, invalidValueMessage, "cli");
      });
      if (option.envVar) {
        this.on("optionEnv:" + oname, (val) => {
          const invalidValueMessage = `error: option '${option.flags}' value '${val}' from env '${option.envVar}' is invalid.`;
          handleOptionValue(val, invalidValueMessage, "env");
        });
      }
      return this;
    }
    _optionEx(config, flags, description, fn, defaultValue) {
      if (typeof flags === "object" && flags instanceof Option) {
        throw new Error("To add an Option object use addOption() instead of option() or requiredOption()");
      }
      const option = this.createOption(flags, description);
      option.makeOptionMandatory(!!config.mandatory);
      if (typeof fn === "function") {
        option.default(defaultValue).argParser(fn);
      } else if (fn instanceof RegExp) {
        const regex = fn;
        fn = (val, def) => {
          const m = regex.exec(val);
          return m ? m[0] : def;
        };
        option.default(defaultValue).argParser(fn);
      } else {
        option.default(fn);
      }
      return this.addOption(option);
    }
    option(flags, description, parseArg, defaultValue) {
      return this._optionEx({}, flags, description, parseArg, defaultValue);
    }
    requiredOption(flags, description, parseArg, defaultValue) {
      return this._optionEx({ mandatory: true }, flags, description, parseArg, defaultValue);
    }
    combineFlagAndOptionalValue(combine = true) {
      this._combineFlagAndOptionalValue = !!combine;
      return this;
    }
    allowUnknownOption(allowUnknown = true) {
      this._allowUnknownOption = !!allowUnknown;
      return this;
    }
    allowExcessArguments(allowExcess = true) {
      this._allowExcessArguments = !!allowExcess;
      return this;
    }
    enablePositionalOptions(positional = true) {
      this._enablePositionalOptions = !!positional;
      return this;
    }
    passThroughOptions(passThrough = true) {
      this._passThroughOptions = !!passThrough;
      this._checkForBrokenPassThrough();
      return this;
    }
    _checkForBrokenPassThrough() {
      if (this.parent && this._passThroughOptions && !this.parent._enablePositionalOptions) {
        throw new Error(`passThroughOptions cannot be used for '${this._name}' without turning on enablePositionalOptions for parent command(s)`);
      }
    }
    storeOptionsAsProperties(storeAsProperties = true) {
      if (this.options.length) {
        throw new Error("call .storeOptionsAsProperties() before adding options");
      }
      if (Object.keys(this._optionValues).length) {
        throw new Error("call .storeOptionsAsProperties() before setting option values");
      }
      this._storeOptionsAsProperties = !!storeAsProperties;
      return this;
    }
    getOptionValue(key) {
      if (this._storeOptionsAsProperties) {
        return this[key];
      }
      return this._optionValues[key];
    }
    setOptionValue(key, value) {
      return this.setOptionValueWithSource(key, value, undefined);
    }
    setOptionValueWithSource(key, value, source) {
      if (this._storeOptionsAsProperties) {
        this[key] = value;
      } else {
        this._optionValues[key] = value;
      }
      this._optionValueSources[key] = source;
      return this;
    }
    getOptionValueSource(key) {
      return this._optionValueSources[key];
    }
    getOptionValueSourceWithGlobals(key) {
      let source;
      this._getCommandAndAncestors().forEach((cmd) => {
        if (cmd.getOptionValueSource(key) !== undefined) {
          source = cmd.getOptionValueSource(key);
        }
      });
      return source;
    }
    _prepareUserArgs(argv, parseOptions) {
      if (argv !== undefined && !Array.isArray(argv)) {
        throw new Error("first parameter to parse must be array or undefined");
      }
      parseOptions = parseOptions || {};
      if (argv === undefined && parseOptions.from === undefined) {
        if (process2.versions?.electron) {
          parseOptions.from = "electron";
        }
        const execArgv = process2.execArgv ?? [];
        if (execArgv.includes("-e") || execArgv.includes("--eval") || execArgv.includes("-p") || execArgv.includes("--print")) {
          parseOptions.from = "eval";
        }
      }
      if (argv === undefined) {
        argv = process2.argv;
      }
      this.rawArgs = argv.slice();
      let userArgs;
      switch (parseOptions.from) {
        case undefined:
        case "node":
          this._scriptPath = argv[1];
          userArgs = argv.slice(2);
          break;
        case "electron":
          if (process2.defaultApp) {
            this._scriptPath = argv[1];
            userArgs = argv.slice(2);
          } else {
            userArgs = argv.slice(1);
          }
          break;
        case "user":
          userArgs = argv.slice(0);
          break;
        case "eval":
          userArgs = argv.slice(1);
          break;
        default:
          throw new Error(`unexpected parse option { from: '${parseOptions.from}' }`);
      }
      if (!this._name && this._scriptPath)
        this.nameFromFilename(this._scriptPath);
      this._name = this._name || "program";
      return userArgs;
    }
    parse(argv, parseOptions) {
      const userArgs = this._prepareUserArgs(argv, parseOptions);
      this._parseCommand([], userArgs);
      return this;
    }
    async parseAsync(argv, parseOptions) {
      const userArgs = this._prepareUserArgs(argv, parseOptions);
      await this._parseCommand([], userArgs);
      return this;
    }
    _executeSubCommand(subcommand, args) {
      args = args.slice();
      let launchWithNode = false;
      const sourceExt = [".js", ".ts", ".tsx", ".mjs", ".cjs"];
      function findFile(baseDir, baseName) {
        const localBin = path.resolve(baseDir, baseName);
        if (fs.existsSync(localBin))
          return localBin;
        if (sourceExt.includes(path.extname(baseName)))
          return;
        const foundExt = sourceExt.find((ext) => fs.existsSync(`${localBin}${ext}`));
        if (foundExt)
          return `${localBin}${foundExt}`;
        return;
      }
      this._checkForMissingMandatoryOptions();
      this._checkForConflictingOptions();
      let executableFile = subcommand._executableFile || `${this._name}-${subcommand._name}`;
      let executableDir = this._executableDir || "";
      if (this._scriptPath) {
        let resolvedScriptPath;
        try {
          resolvedScriptPath = fs.realpathSync(this._scriptPath);
        } catch (err) {
          resolvedScriptPath = this._scriptPath;
        }
        executableDir = path.resolve(path.dirname(resolvedScriptPath), executableDir);
      }
      if (executableDir) {
        let localFile = findFile(executableDir, executableFile);
        if (!localFile && !subcommand._executableFile && this._scriptPath) {
          const legacyName = path.basename(this._scriptPath, path.extname(this._scriptPath));
          if (legacyName !== this._name) {
            localFile = findFile(executableDir, `${legacyName}-${subcommand._name}`);
          }
        }
        executableFile = localFile || executableFile;
      }
      launchWithNode = sourceExt.includes(path.extname(executableFile));
      let proc;
      if (process2.platform !== "win32") {
        if (launchWithNode) {
          args.unshift(executableFile);
          args = incrementNodeInspectorPort(process2.execArgv).concat(args);
          proc = childProcess.spawn(process2.argv[0], args, { stdio: "inherit" });
        } else {
          proc = childProcess.spawn(executableFile, args, { stdio: "inherit" });
        }
      } else {
        args.unshift(executableFile);
        args = incrementNodeInspectorPort(process2.execArgv).concat(args);
        proc = childProcess.spawn(process2.execPath, args, { stdio: "inherit" });
      }
      if (!proc.killed) {
        const signals = ["SIGUSR1", "SIGUSR2", "SIGTERM", "SIGINT", "SIGHUP"];
        signals.forEach((signal) => {
          process2.on(signal, () => {
            if (proc.killed === false && proc.exitCode === null) {
              proc.kill(signal);
            }
          });
        });
      }
      const exitCallback = this._exitCallback;
      proc.on("close", (code) => {
        code = code ?? 1;
        if (!exitCallback) {
          process2.exit(code);
        } else {
          exitCallback(new CommanderError(code, "commander.executeSubCommandAsync", "(close)"));
        }
      });
      proc.on("error", (err) => {
        if (err.code === "ENOENT") {
          const executableDirMessage = executableDir ? `searched for local subcommand relative to directory '${executableDir}'` : "no directory for search for local subcommand, use .executableDir() to supply a custom directory";
          const executableMissing = `'${executableFile}' does not exist
 - if '${subcommand._name}' is not meant to be an executable command, remove description parameter from '.command()' and use '.description()' instead
 - if the default executable name is not suitable, use the executableFile option to supply a custom name or path
 - ${executableDirMessage}`;
          throw new Error(executableMissing);
        } else if (err.code === "EACCES") {
          throw new Error(`'${executableFile}' not executable`);
        }
        if (!exitCallback) {
          process2.exit(1);
        } else {
          const wrappedError = new CommanderError(1, "commander.executeSubCommandAsync", "(error)");
          wrappedError.nestedError = err;
          exitCallback(wrappedError);
        }
      });
      this.runningCommand = proc;
    }
    _dispatchSubcommand(commandName, operands, unknown) {
      const subCommand = this._findCommand(commandName);
      if (!subCommand)
        this.help({ error: true });
      let promiseChain;
      promiseChain = this._chainOrCallSubCommandHook(promiseChain, subCommand, "preSubcommand");
      promiseChain = this._chainOrCall(promiseChain, () => {
        if (subCommand._executableHandler) {
          this._executeSubCommand(subCommand, operands.concat(unknown));
        } else {
          return subCommand._parseCommand(operands, unknown);
        }
      });
      return promiseChain;
    }
    _dispatchHelpCommand(subcommandName) {
      if (!subcommandName) {
        this.help();
      }
      const subCommand = this._findCommand(subcommandName);
      if (subCommand && !subCommand._executableHandler) {
        subCommand.help();
      }
      return this._dispatchSubcommand(subcommandName, [], [this._getHelpOption()?.long ?? this._getHelpOption()?.short ?? "--help"]);
    }
    _checkNumberOfArguments() {
      this.registeredArguments.forEach((arg, i) => {
        if (arg.required && this.args[i] == null) {
          this.missingArgument(arg.name());
        }
      });
      if (this.registeredArguments.length > 0 && this.registeredArguments[this.registeredArguments.length - 1].variadic) {
        return;
      }
      if (this.args.length > this.registeredArguments.length) {
        this._excessArguments(this.args);
      }
    }
    _processArguments() {
      const myParseArg = (argument, value, previous) => {
        let parsedValue = value;
        if (value !== null && argument.parseArg) {
          const invalidValueMessage = `error: command-argument value '${value}' is invalid for argument '${argument.name()}'.`;
          parsedValue = this._callParseArg(argument, value, previous, invalidValueMessage);
        }
        return parsedValue;
      };
      this._checkNumberOfArguments();
      const processedArgs = [];
      this.registeredArguments.forEach((declaredArg, index) => {
        let value = declaredArg.defaultValue;
        if (declaredArg.variadic) {
          if (index < this.args.length) {
            value = this.args.slice(index);
            if (declaredArg.parseArg) {
              value = value.reduce((processed, v) => {
                return myParseArg(declaredArg, v, processed);
              }, declaredArg.defaultValue);
            }
          } else if (value === undefined) {
            value = [];
          }
        } else if (index < this.args.length) {
          value = this.args[index];
          if (declaredArg.parseArg) {
            value = myParseArg(declaredArg, value, declaredArg.defaultValue);
          }
        }
        processedArgs[index] = value;
      });
      this.processedArgs = processedArgs;
    }
    _chainOrCall(promise, fn) {
      if (promise && promise.then && typeof promise.then === "function") {
        return promise.then(() => fn());
      }
      return fn();
    }
    _chainOrCallHooks(promise, event) {
      let result = promise;
      const hooks = [];
      this._getCommandAndAncestors().reverse().filter((cmd) => cmd._lifeCycleHooks[event] !== undefined).forEach((hookedCommand) => {
        hookedCommand._lifeCycleHooks[event].forEach((callback) => {
          hooks.push({ hookedCommand, callback });
        });
      });
      if (event === "postAction") {
        hooks.reverse();
      }
      hooks.forEach((hookDetail) => {
        result = this._chainOrCall(result, () => {
          return hookDetail.callback(hookDetail.hookedCommand, this);
        });
      });
      return result;
    }
    _chainOrCallSubCommandHook(promise, subCommand, event) {
      let result = promise;
      if (this._lifeCycleHooks[event] !== undefined) {
        this._lifeCycleHooks[event].forEach((hook) => {
          result = this._chainOrCall(result, () => {
            return hook(this, subCommand);
          });
        });
      }
      return result;
    }
    _parseCommand(operands, unknown) {
      const parsed = this.parseOptions(unknown);
      this._parseOptionsEnv();
      this._parseOptionsImplied();
      operands = operands.concat(parsed.operands);
      unknown = parsed.unknown;
      this.args = operands.concat(unknown);
      if (operands && this._findCommand(operands[0])) {
        return this._dispatchSubcommand(operands[0], operands.slice(1), unknown);
      }
      if (this._getHelpCommand() && operands[0] === this._getHelpCommand().name()) {
        return this._dispatchHelpCommand(operands[1]);
      }
      if (this._defaultCommandName) {
        this._outputHelpIfRequested(unknown);
        return this._dispatchSubcommand(this._defaultCommandName, operands, unknown);
      }
      if (this.commands.length && this.args.length === 0 && !this._actionHandler && !this._defaultCommandName) {
        this.help({ error: true });
      }
      this._outputHelpIfRequested(parsed.unknown);
      this._checkForMissingMandatoryOptions();
      this._checkForConflictingOptions();
      const checkForUnknownOptions = () => {
        if (parsed.unknown.length > 0) {
          this.unknownOption(parsed.unknown[0]);
        }
      };
      const commandEvent = `command:${this.name()}`;
      if (this._actionHandler) {
        checkForUnknownOptions();
        this._processArguments();
        let promiseChain;
        promiseChain = this._chainOrCallHooks(promiseChain, "preAction");
        promiseChain = this._chainOrCall(promiseChain, () => this._actionHandler(this.processedArgs));
        if (this.parent) {
          promiseChain = this._chainOrCall(promiseChain, () => {
            this.parent.emit(commandEvent, operands, unknown);
          });
        }
        promiseChain = this._chainOrCallHooks(promiseChain, "postAction");
        return promiseChain;
      }
      if (this.parent && this.parent.listenerCount(commandEvent)) {
        checkForUnknownOptions();
        this._processArguments();
        this.parent.emit(commandEvent, operands, unknown);
      } else if (operands.length) {
        if (this._findCommand("*")) {
          return this._dispatchSubcommand("*", operands, unknown);
        }
        if (this.listenerCount("command:*")) {
          this.emit("command:*", operands, unknown);
        } else if (this.commands.length) {
          this.unknownCommand();
        } else {
          checkForUnknownOptions();
          this._processArguments();
        }
      } else if (this.commands.length) {
        checkForUnknownOptions();
        this.help({ error: true });
      } else {
        checkForUnknownOptions();
        this._processArguments();
      }
    }
    _findCommand(name) {
      if (!name)
        return;
      return this.commands.find((cmd) => cmd._name === name || cmd._aliases.includes(name));
    }
    _findOption(arg) {
      return this.options.find((option) => option.is(arg));
    }
    _checkForMissingMandatoryOptions() {
      this._getCommandAndAncestors().forEach((cmd) => {
        cmd.options.forEach((anOption) => {
          if (anOption.mandatory && cmd.getOptionValue(anOption.attributeName()) === undefined) {
            cmd.missingMandatoryOptionValue(anOption);
          }
        });
      });
    }
    _checkForConflictingLocalOptions() {
      const definedNonDefaultOptions = this.options.filter((option) => {
        const optionKey = option.attributeName();
        if (this.getOptionValue(optionKey) === undefined) {
          return false;
        }
        return this.getOptionValueSource(optionKey) !== "default";
      });
      const optionsWithConflicting = definedNonDefaultOptions.filter((option) => option.conflictsWith.length > 0);
      optionsWithConflicting.forEach((option) => {
        const conflictingAndDefined = definedNonDefaultOptions.find((defined) => option.conflictsWith.includes(defined.attributeName()));
        if (conflictingAndDefined) {
          this._conflictingOption(option, conflictingAndDefined);
        }
      });
    }
    _checkForConflictingOptions() {
      this._getCommandAndAncestors().forEach((cmd) => {
        cmd._checkForConflictingLocalOptions();
      });
    }
    parseOptions(argv) {
      const operands = [];
      const unknown = [];
      let dest = operands;
      const args = argv.slice();
      function maybeOption(arg) {
        return arg.length > 1 && arg[0] === "-";
      }
      let activeVariadicOption = null;
      while (args.length) {
        const arg = args.shift();
        if (arg === "--") {
          if (dest === unknown)
            dest.push(arg);
          dest.push(...args);
          break;
        }
        if (activeVariadicOption && !maybeOption(arg)) {
          this.emit(`option:${activeVariadicOption.name()}`, arg);
          continue;
        }
        activeVariadicOption = null;
        if (maybeOption(arg)) {
          const option = this._findOption(arg);
          if (option) {
            if (option.required) {
              const value = args.shift();
              if (value === undefined)
                this.optionMissingArgument(option);
              this.emit(`option:${option.name()}`, value);
            } else if (option.optional) {
              let value = null;
              if (args.length > 0 && !maybeOption(args[0])) {
                value = args.shift();
              }
              this.emit(`option:${option.name()}`, value);
            } else {
              this.emit(`option:${option.name()}`);
            }
            activeVariadicOption = option.variadic ? option : null;
            continue;
          }
        }
        if (arg.length > 2 && arg[0] === "-" && arg[1] !== "-") {
          const option = this._findOption(`-${arg[1]}`);
          if (option) {
            if (option.required || option.optional && this._combineFlagAndOptionalValue) {
              this.emit(`option:${option.name()}`, arg.slice(2));
            } else {
              this.emit(`option:${option.name()}`);
              args.unshift(`-${arg.slice(2)}`);
            }
            continue;
          }
        }
        if (/^--[^=]+=/.test(arg)) {
          const index = arg.indexOf("=");
          const option = this._findOption(arg.slice(0, index));
          if (option && (option.required || option.optional)) {
            this.emit(`option:${option.name()}`, arg.slice(index + 1));
            continue;
          }
        }
        if (maybeOption(arg)) {
          dest = unknown;
        }
        if ((this._enablePositionalOptions || this._passThroughOptions) && operands.length === 0 && unknown.length === 0) {
          if (this._findCommand(arg)) {
            operands.push(arg);
            if (args.length > 0)
              unknown.push(...args);
            break;
          } else if (this._getHelpCommand() && arg === this._getHelpCommand().name()) {
            operands.push(arg);
            if (args.length > 0)
              operands.push(...args);
            break;
          } else if (this._defaultCommandName) {
            unknown.push(arg);
            if (args.length > 0)
              unknown.push(...args);
            break;
          }
        }
        if (this._passThroughOptions) {
          dest.push(arg);
          if (args.length > 0)
            dest.push(...args);
          break;
        }
        dest.push(arg);
      }
      return { operands, unknown };
    }
    opts() {
      if (this._storeOptionsAsProperties) {
        const result = {};
        const len = this.options.length;
        for (let i = 0;i < len; i++) {
          const key = this.options[i].attributeName();
          result[key] = key === this._versionOptionName ? this._version : this[key];
        }
        return result;
      }
      return this._optionValues;
    }
    optsWithGlobals() {
      return this._getCommandAndAncestors().reduce((combinedOptions, cmd) => Object.assign(combinedOptions, cmd.opts()), {});
    }
    error(message, errorOptions) {
      this._outputConfiguration.outputError(`${message}
`, this._outputConfiguration.writeErr);
      if (typeof this._showHelpAfterError === "string") {
        this._outputConfiguration.writeErr(`${this._showHelpAfterError}
`);
      } else if (this._showHelpAfterError) {
        this._outputConfiguration.writeErr(`
`);
        this.outputHelp({ error: true });
      }
      const config = errorOptions || {};
      const exitCode = config.exitCode || 1;
      const code = config.code || "commander.error";
      this._exit(exitCode, code, message);
    }
    _parseOptionsEnv() {
      this.options.forEach((option) => {
        if (option.envVar && option.envVar in process2.env) {
          const optionKey = option.attributeName();
          if (this.getOptionValue(optionKey) === undefined || ["default", "config", "env"].includes(this.getOptionValueSource(optionKey))) {
            if (option.required || option.optional) {
              this.emit(`optionEnv:${option.name()}`, process2.env[option.envVar]);
            } else {
              this.emit(`optionEnv:${option.name()}`);
            }
          }
        }
      });
    }
    _parseOptionsImplied() {
      const dualHelper = new DualOptions(this.options);
      const hasCustomOptionValue = (optionKey) => {
        return this.getOptionValue(optionKey) !== undefined && !["default", "implied"].includes(this.getOptionValueSource(optionKey));
      };
      this.options.filter((option) => option.implied !== undefined && hasCustomOptionValue(option.attributeName()) && dualHelper.valueFromOption(this.getOptionValue(option.attributeName()), option)).forEach((option) => {
        Object.keys(option.implied).filter((impliedKey) => !hasCustomOptionValue(impliedKey)).forEach((impliedKey) => {
          this.setOptionValueWithSource(impliedKey, option.implied[impliedKey], "implied");
        });
      });
    }
    missingArgument(name) {
      const message = `error: missing required argument '${name}'`;
      this.error(message, { code: "commander.missingArgument" });
    }
    optionMissingArgument(option) {
      const message = `error: option '${option.flags}' argument missing`;
      this.error(message, { code: "commander.optionMissingArgument" });
    }
    missingMandatoryOptionValue(option) {
      const message = `error: required option '${option.flags}' not specified`;
      this.error(message, { code: "commander.missingMandatoryOptionValue" });
    }
    _conflictingOption(option, conflictingOption) {
      const findBestOptionFromValue = (option2) => {
        const optionKey = option2.attributeName();
        const optionValue = this.getOptionValue(optionKey);
        const negativeOption = this.options.find((target) => target.negate && optionKey === target.attributeName());
        const positiveOption = this.options.find((target) => !target.negate && optionKey === target.attributeName());
        if (negativeOption && (negativeOption.presetArg === undefined && optionValue === false || negativeOption.presetArg !== undefined && optionValue === negativeOption.presetArg)) {
          return negativeOption;
        }
        return positiveOption || option2;
      };
      const getErrorMessage = (option2) => {
        const bestOption = findBestOptionFromValue(option2);
        const optionKey = bestOption.attributeName();
        const source = this.getOptionValueSource(optionKey);
        if (source === "env") {
          return `environment variable '${bestOption.envVar}'`;
        }
        return `option '${bestOption.flags}'`;
      };
      const message = `error: ${getErrorMessage(option)} cannot be used with ${getErrorMessage(conflictingOption)}`;
      this.error(message, { code: "commander.conflictingOption" });
    }
    unknownOption(flag) {
      if (this._allowUnknownOption)
        return;
      let suggestion = "";
      if (flag.startsWith("--") && this._showSuggestionAfterError) {
        let candidateFlags = [];
        let command = this;
        do {
          const moreFlags = command.createHelp().visibleOptions(command).filter((option) => option.long).map((option) => option.long);
          candidateFlags = candidateFlags.concat(moreFlags);
          command = command.parent;
        } while (command && !command._enablePositionalOptions);
        suggestion = suggestSimilar(flag, candidateFlags);
      }
      const message = `error: unknown option '${flag}'${suggestion}`;
      this.error(message, { code: "commander.unknownOption" });
    }
    _excessArguments(receivedArgs) {
      if (this._allowExcessArguments)
        return;
      const expected = this.registeredArguments.length;
      const s = expected === 1 ? "" : "s";
      const forSubcommand = this.parent ? ` for '${this.name()}'` : "";
      const message = `error: too many arguments${forSubcommand}. Expected ${expected} argument${s} but got ${receivedArgs.length}.`;
      this.error(message, { code: "commander.excessArguments" });
    }
    unknownCommand() {
      const unknownName = this.args[0];
      let suggestion = "";
      if (this._showSuggestionAfterError) {
        const candidateNames = [];
        this.createHelp().visibleCommands(this).forEach((command) => {
          candidateNames.push(command.name());
          if (command.alias())
            candidateNames.push(command.alias());
        });
        suggestion = suggestSimilar(unknownName, candidateNames);
      }
      const message = `error: unknown command '${unknownName}'${suggestion}`;
      this.error(message, { code: "commander.unknownCommand" });
    }
    version(str, flags, description) {
      if (str === undefined)
        return this._version;
      this._version = str;
      flags = flags || "-V, --version";
      description = description || "output the version number";
      const versionOption = this.createOption(flags, description);
      this._versionOptionName = versionOption.attributeName();
      this._registerOption(versionOption);
      this.on("option:" + versionOption.name(), () => {
        this._outputConfiguration.writeOut(`${str}
`);
        this._exit(0, "commander.version", str);
      });
      return this;
    }
    description(str, argsDescription) {
      if (str === undefined && argsDescription === undefined)
        return this._description;
      this._description = str;
      if (argsDescription) {
        this._argsDescription = argsDescription;
      }
      return this;
    }
    summary(str) {
      if (str === undefined)
        return this._summary;
      this._summary = str;
      return this;
    }
    alias(alias) {
      if (alias === undefined)
        return this._aliases[0];
      let command = this;
      if (this.commands.length !== 0 && this.commands[this.commands.length - 1]._executableHandler) {
        command = this.commands[this.commands.length - 1];
      }
      if (alias === command._name)
        throw new Error("Command alias can't be the same as its name");
      const matchingCommand = this.parent?._findCommand(alias);
      if (matchingCommand) {
        const existingCmd = [matchingCommand.name()].concat(matchingCommand.aliases()).join("|");
        throw new Error(`cannot add alias '${alias}' to command '${this.name()}' as already have command '${existingCmd}'`);
      }
      command._aliases.push(alias);
      return this;
    }
    aliases(aliases) {
      if (aliases === undefined)
        return this._aliases;
      aliases.forEach((alias) => this.alias(alias));
      return this;
    }
    usage(str) {
      if (str === undefined) {
        if (this._usage)
          return this._usage;
        const args = this.registeredArguments.map((arg) => {
          return humanReadableArgName(arg);
        });
        return [].concat(this.options.length || this._helpOption !== null ? "[options]" : [], this.commands.length ? "[command]" : [], this.registeredArguments.length ? args : []).join(" ");
      }
      this._usage = str;
      return this;
    }
    name(str) {
      if (str === undefined)
        return this._name;
      this._name = str;
      return this;
    }
    nameFromFilename(filename) {
      this._name = path.basename(filename, path.extname(filename));
      return this;
    }
    executableDir(path2) {
      if (path2 === undefined)
        return this._executableDir;
      this._executableDir = path2;
      return this;
    }
    helpInformation(contextOptions) {
      const helper = this.createHelp();
      if (helper.helpWidth === undefined) {
        helper.helpWidth = contextOptions && contextOptions.error ? this._outputConfiguration.getErrHelpWidth() : this._outputConfiguration.getOutHelpWidth();
      }
      return helper.formatHelp(this, helper);
    }
    _getHelpContext(contextOptions) {
      contextOptions = contextOptions || {};
      const context = { error: !!contextOptions.error };
      let write;
      if (context.error) {
        write = (arg) => this._outputConfiguration.writeErr(arg);
      } else {
        write = (arg) => this._outputConfiguration.writeOut(arg);
      }
      context.write = contextOptions.write || write;
      context.command = this;
      return context;
    }
    outputHelp(contextOptions) {
      let deprecatedCallback;
      if (typeof contextOptions === "function") {
        deprecatedCallback = contextOptions;
        contextOptions = undefined;
      }
      const context = this._getHelpContext(contextOptions);
      this._getCommandAndAncestors().reverse().forEach((command) => command.emit("beforeAllHelp", context));
      this.emit("beforeHelp", context);
      let helpInformation = this.helpInformation(context);
      if (deprecatedCallback) {
        helpInformation = deprecatedCallback(helpInformation);
        if (typeof helpInformation !== "string" && !Buffer.isBuffer(helpInformation)) {
          throw new Error("outputHelp callback must return a string or a Buffer");
        }
      }
      context.write(helpInformation);
      if (this._getHelpOption()?.long) {
        this.emit(this._getHelpOption().long);
      }
      this.emit("afterHelp", context);
      this._getCommandAndAncestors().forEach((command) => command.emit("afterAllHelp", context));
    }
    helpOption(flags, description) {
      if (typeof flags === "boolean") {
        if (flags) {
          this._helpOption = this._helpOption ?? undefined;
        } else {
          this._helpOption = null;
        }
        return this;
      }
      flags = flags ?? "-h, --help";
      description = description ?? "display help for command";
      this._helpOption = this.createOption(flags, description);
      return this;
    }
    _getHelpOption() {
      if (this._helpOption === undefined) {
        this.helpOption(undefined, undefined);
      }
      return this._helpOption;
    }
    addHelpOption(option) {
      this._helpOption = option;
      return this;
    }
    help(contextOptions) {
      this.outputHelp(contextOptions);
      let exitCode = process2.exitCode || 0;
      if (exitCode === 0 && contextOptions && typeof contextOptions !== "function" && contextOptions.error) {
        exitCode = 1;
      }
      this._exit(exitCode, "commander.help", "(outputHelp)");
    }
    addHelpText(position, text) {
      const allowedValues = ["beforeAll", "before", "after", "afterAll"];
      if (!allowedValues.includes(position)) {
        throw new Error(`Unexpected value for position to addHelpText.
Expecting one of '${allowedValues.join("', '")}'`);
      }
      const helpEvent = `${position}Help`;
      this.on(helpEvent, (context) => {
        let helpStr;
        if (typeof text === "function") {
          helpStr = text({ error: context.error, command: context.command });
        } else {
          helpStr = text;
        }
        if (helpStr) {
          context.write(`${helpStr}
`);
        }
      });
      return this;
    }
    _outputHelpIfRequested(args) {
      const helpOption = this._getHelpOption();
      const helpRequested = helpOption && args.find((arg) => helpOption.is(arg));
      if (helpRequested) {
        this.outputHelp();
        this._exit(0, "commander.helpDisplayed", "(outputHelp)");
      }
    }
  }
  function incrementNodeInspectorPort(args) {
    return args.map((arg) => {
      if (!arg.startsWith("--inspect")) {
        return arg;
      }
      let debugOption;
      let debugHost = "127.0.0.1";
      let debugPort = "9229";
      let match;
      if ((match = arg.match(/^(--inspect(-brk)?)$/)) !== null) {
        debugOption = match[1];
      } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+)$/)) !== null) {
        debugOption = match[1];
        if (/^\d+$/.test(match[3])) {
          debugPort = match[3];
        } else {
          debugHost = match[3];
        }
      } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+):(\d+)$/)) !== null) {
        debugOption = match[1];
        debugHost = match[3];
        debugPort = match[4];
      }
      if (debugOption && debugPort !== "0") {
        return `${debugOption}=${debugHost}:${parseInt(debugPort) + 1}`;
      }
      return arg;
    });
  }
  exports.Command = Command;
});

// node_modules/commander/index.js
var require_commander = __commonJS((exports) => {
  var { Argument } = require_argument();
  var { Command } = require_command();
  var { CommanderError, InvalidArgumentError } = require_error();
  var { Help } = require_help();
  var { Option } = require_option();
  exports.program = new Command;
  exports.createCommand = (name) => new Command(name);
  exports.createOption = (flags, description) => new Option(flags, description);
  exports.createArgument = (name, description) => new Argument(name, description);
  exports.Command = Command;
  exports.Option = Option;
  exports.Argument = Argument;
  exports.Help = Help;
  exports.CommanderError = CommanderError;
  exports.InvalidArgumentError = InvalidArgumentError;
  exports.InvalidOptionArgumentError = InvalidArgumentError;
});

// src/cli.ts
import { watch } from "fs";
import { access, mkdir as mkdir2, writeFile as writeFile2 } from "fs/promises";
import { basename, dirname as dirname2, join as join2, resolve } from "path";

// node_modules/commander/esm.mjs
var import__ = __toESM(require_commander(), 1);
var {
  program,
  createCommand,
  createArgument,
  createOption,
  CommanderError,
  InvalidArgumentError,
  InvalidOptionArgumentError,
  Command,
  Argument,
  Option,
  Help
} = import__.default;

// src/agent.ts
var AGENT_INSTRUCTIONS = `# Authoring slidekick decks

A slidekick deck is a TSX file that default-exports a function returning an
array of <Slide> elements. The deck is pushed to Google Slides via the
slidekick CLI \u2014 slides are real, editable text boxes (not images).

## File shape

\`\`\`tsx
import { Slide, Title, Subtitle, Bullets, Bullet } from "slidekick";

export default function deck() {
  return [
    <Slide>
      <Title>Slide one</Title>
      <Subtitle>Optional subtitle</Subtitle>
    </Slide>,
    <Slide>
      <Title>Slide two</Title>
      <Bullets>
        <Bullet>First point</Bullet>
        <Bullet>Second point</Bullet>
      </Bullets>
    </Slide>,
  ];
}
\`\`\`

## Vocabulary

Container:
- <Slide>          the canonical slide. Children stack vertically.

Layout:
- <Columns>        wraps <Column> children, splits horizontally.
- <Column weight?> a column inside <Columns>. Optional weight for unequal split.

Content:
- <Title>          one short line, ~60 chars max. Big, bold.
- <Subtitle>       sits under a <Title>.
- <Heading>        section heading, e.g. inside a <Column>.
- <Bullets>        wraps <Bullet> children.
- <Bullet>         one bullet point.
- <Text>           a paragraph or short prose.
- <Image src>      an image. src must be a public HTTPS URL.
- <Group>          layout-transparent container that auto-numbers
                   reveal steps for its direct children (preview only).

## Composition rules

- Always wrap each slide in <Slide>.
- Put <Bullet> only inside <Bullets>.
- Put <Column> only inside <Columns>.
- Use <Columns> at the top level of a <Slide>, or after a <Title>.
- Do not use HTML tags (<div>, <h1>, etc.) \u2014 they are not supported.
- Do not pass x/y coordinates. The renderer owns layout.

## Authoring guidance

- Keep titles under 60 characters and bullets under ~10 words each.
- 5\u20137 bullets per slide max. Split into multiple slides if crowded.
- Prefer <Columns> over crowding a single column with too much content.
- When unsure, default to a <Slide> with a <Title> and <Bullets>.

## Workflow

The user runs:

  slidekick dev                       # local HTML preview, hot-reloads
  slidekick new deck.tsx --title "X"  # create new Slides deck
  slidekick push deck.tsx --id <id>   # overwrite an existing Slides deck
  slidekick pull <id|url> -o deck.tsx # round-trip an existing deck back to TSX

A deck ID is the long string in a Slides URL:
https://docs.google.com/presentation/d/<ID>/edit
`;

// src/auth.ts
import { mkdir, readFile, writeFile } from "fs/promises";
import { createServer } from "http";
import { homedir } from "os";
import { dirname, join } from "path";
import { google } from "googleapis";
var SCOPES = [
  "https://www.googleapis.com/auth/presentations",
  "https://www.googleapis.com/auth/drive.file"
];
var TOKEN_PATH = join(homedir(), ".config", "slidekick", "token.json");
function makeOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:4242/oauth2callback";
  if (!clientId || !clientSecret) {
    throw new Error("Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment.");
  }
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}
async function loadTokens() {
  try {
    const raw = await readFile(TOKEN_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
async function saveTokens(tokens) {
  await mkdir(dirname(TOKEN_PATH), { recursive: true });
  await writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2));
}
async function getAuthedClient() {
  const tokens = await loadTokens();
  if (!tokens) {
    throw new Error('No saved credentials. Run "slidekick auth login" first.');
  }
  const client = makeOAuth2Client();
  client.setCredentials(tokens);
  return client;
}
async function login() {
  const client = makeOAuth2Client();
  const url = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES
  });
  console.log(`
Open this URL in your browser:

  ${url}
`);
  const code = await new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const u = new URL(req.url ?? "", "http://localhost:4242");
      const c = u.searchParams.get("code");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`<!doctype html><html><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f5f5f5"><div style="background:#fff;padding:2rem 3rem;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,.08);text-align:center"><h1 style="margin:0 0 .5rem">slidekick authorized</h1><p style="margin:0;color:#666">You can close this tab.</p></div></body></html>`);
      server.close();
      if (c)
        resolve(c);
      else
        reject(new Error("No code in redirect"));
    });
    server.listen(4242);
    console.log(`Waiting for OAuth redirect on http://localhost:4242 ...
`);
  });
  const { tokens } = await client.getToken(code);
  await saveTokens(tokens);
  console.log(`
Saved credentials to ${TOKEN_PATH}`);
}
function tokenPath() {
  return TOKEN_PATH;
}
function missingScopeHelp() {
  return `If you see "insufficient permissions" or "invalid_scope":

  In Google Cloud Console (the project owning these OAuth creds):
    1. Enable APIs:  Google Slides API, Google Drive API
    2. OAuth consent screen \u2192 add scopes:
         ${SCOPES.join(`
         `)}
    3. Re-run: slidekick auth login`;
}

// src/layout.ts
var SLIDE_W = 13.333;
var SLIDE_H = 7.5;
var PAD = 0.5;
var GAP = 0.2;
var TITLE_H = 1;
var SUBTITLE_H = 0.7;
var HEADING_H = 0.5;
var TEXT_NAT_H = 0.6;
var BULLET_NAT_H = 0.4;
var IMAGE_NAT_H = 3;
var constStep = (s) => () => s;
function layoutDeck(deck) {
  return deck.map(layoutSlide);
}
function layoutSlide(slide) {
  const out = [];
  const hasChildren = slide.children.length > 0;
  const padded = !slide.background || hasChildren;
  const pad = padded ? PAD : 0;
  const area = { x: pad, y: pad, w: SLIDE_W - 2 * pad, h: SLIDE_H - 2 * pad };
  const slideStep = slide.step ?? 0;
  if (slide.align && hasChildren) {
    layoutAligned(slide.children, area, out, slideStep, slide.align);
  } else {
    layoutVertical(slide.children, area, out, constStep(slideStep), slideStep);
  }
  return { background: slide.background, align: slide.align, placed: out };
}
function fixedHeight(child) {
  if (child.kind === "title")
    return TITLE_H;
  if (child.kind === "subtitle")
    return SUBTITLE_H;
  if (child.kind === "heading")
    return HEADING_H;
  return null;
}
function naturalHeight(child) {
  const fixed = fixedHeight(child);
  if (fixed != null)
    return fixed;
  switch (child.kind) {
    case "text":
      return TEXT_NAT_H;
    case "bullets":
      return Math.max(BULLET_NAT_H, child.children.length * BULLET_NAT_H);
    case "image":
      return IMAGE_NAT_H;
    case "columns":
    case "group":
      return 1;
    default:
      return TEXT_NAT_H;
  }
}
function layoutVertical(children, area, out, stepFor, inheritedStep) {
  if (children.length === 0)
    return;
  const fixedTotal = children.reduce((s, c) => s + (fixedHeight(c) ?? 0), 0);
  const flexCount = children.filter((c) => fixedHeight(c) === null).length;
  const totalGaps = Math.max(0, children.length - 1) * GAP;
  const flexAvailable = Math.max(0, area.h - fixedTotal - totalGaps);
  const flexEach = flexCount > 0 ? flexAvailable / flexCount : 0;
  let y = area.y;
  for (let i = 0;i < children.length; i++) {
    const child = children[i];
    const h = fixedHeight(child) ?? flexEach;
    layoutChild(child, { x: area.x, y, w: area.w, h }, out, stepFor(i), inheritedStep);
    y += h + GAP;
  }
}
function layoutAligned(children, area, out, inheritedStep, align) {
  const heights = children.map(naturalHeight);
  const totalGaps = Math.max(0, children.length - 1) * GAP;
  const total = heights.reduce((s, h) => s + h, 0) + totalGaps;
  const slack = Math.max(0, area.h - total);
  const offset = align === "center" ? slack / 2 : align === "end" ? slack : 0;
  let y = area.y + offset;
  for (let i = 0;i < children.length; i++) {
    const child = children[i];
    const h = heights[i];
    layoutChild(child, { x: area.x, y, w: area.w, h }, out, inheritedStep, inheritedStep);
    y += h + GAP;
  }
}
function layoutChild(node, area, out, stepHint, inheritedStep) {
  const step = node.step ?? stepHint;
  switch (node.kind) {
    case "title":
    case "subtitle":
    case "heading":
    case "text":
      out.push({
        kind: "text",
        role: node.kind,
        runs: node.runs,
        align: node.align,
        ...area,
        step
      });
      return;
    case "bullets": {
      const bullets = node.children.map((b) => ({
        runs: b.runs,
        align: b.align,
        step: b.step ?? step
      }));
      out.push({ kind: "bullets", bullets, ...area, step });
      return;
    }
    case "image":
      out.push({
        kind: "image",
        src: node.src,
        alt: node.alt,
        fit: node.fit ?? "contain",
        crop: node.crop,
        ...area,
        step
      });
      return;
    case "columns": {
      const cols = node.children;
      if (cols.length === 0)
        return;
      const totalWeight = cols.reduce((s, c) => s + (c.weight ?? 1), 0);
      const gap = node.gap ?? 0.3;
      const totalGap = (cols.length - 1) * gap;
      const usableW = Math.max(0, area.w - totalGap);
      let x = area.x;
      for (const col of cols) {
        const w = (col.weight ?? 1) / totalWeight * usableW;
        const colStep = col.step ?? step;
        layoutVertical(col.children, { x, y: area.y, w, h: area.h }, out, constStep(colStep), colStep);
        x += w + gap;
      }
      return;
    }
    case "group": {
      const explicit = typeof node.step === "number";
      const stepFor = explicit ? constStep(step) : (i) => i + 1;
      layoutVertical(node.children, area, out, stepFor, step);
      return;
    }
  }
}

// src/html.ts
var SCALE = 80;
var ROLE_STYLES = {
  title: { fontSize: 36, bold: true },
  subtitle: { fontSize: 22 },
  heading: { fontSize: 22, bold: true },
  text: { fontSize: 16 },
  bullet: { fontSize: 18 }
};
var TEXT_ALIGN = {
  start: "left",
  center: "center",
  end: "right"
};
var SIZE_TOKENS = { sm: 0.85, md: 1, lg: 1.25 };
function normalize(input) {
  if (Array.isArray(input))
    return { theme: {}, slides: layoutDeck(input) };
  return { theme: input.theme ?? {}, slides: layoutDeck(input.slides) };
}
function renderHtml(input) {
  const { theme, slides } = normalize(input);
  const slidesHtml = slides.map((slideLayout, i) => {
    const items = slideLayout.placed.map((p) => placedToHtml(p, theme)).join(`
`);
    const maxStep = slideLayout.placed.reduce((m, p) => Math.max(m, maxStepOf(p)), 0);
    const bg = slideLayout.background ?? theme.background;
    const bgStyle = bgToCss(bg);
    const themeText = theme.text ? `color:${escapeAttr(theme.text)};` : "";
    const themeFont = theme.fonts?.body ? `font-family:${escapeAttr(theme.fonts.body)};` : "";
    return `<section class="slide" data-index="${i}" data-current-step="0" data-max-step="${maxStep}" style="${bgStyle}${themeText}${themeFont}">${items}<div class="step-badge"></div></section>`;
  }).join(`
`);
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>slidekick preview</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; background: #1a1a1a; font-family: -apple-system, "Segoe UI", system-ui, sans-serif; padding: 24px; }
  .slide {
    position: relative;
    width: ${SLIDE_W * SCALE}px;
    height: ${SLIDE_H * SCALE}px;
    background: #fafafa;
    margin: 0 auto 24px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    color: #111;
    overflow: hidden;
    outline: 2px solid transparent;
    transition: outline-color 0.15s;
    background-size: cover;
    background-position: center;
  }
  .slide.focused { outline-color: #4a9eff; }
  .placed { position: absolute; display: flex; flex-direction: column; }
  .role-title { font-size: 36px; font-weight: 700; justify-content: center; }
  .role-subtitle { font-size: 22px; justify-content: center; }
  .role-heading { font-size: 22px; font-weight: 600; justify-content: center; }
  .role-text { font-size: 16px; }
  .role-bullet { font-size: 18px; }
  .bullets { font-size: 18px; padding-left: 1.2em; margin: 0; list-style: disc; }
  .bullets li { margin: 0 0 6px 0; }
  img.placed { object-fit: contain; }
  img.fit-cover { object-fit: cover; }
  img.fit-fill { object-fit: fill; }
  .stepped-hidden { visibility: hidden; }
  .step-badge {
    position: absolute; right: 8px; bottom: 8px;
    font: 11px/1 ui-monospace, monospace;
    color: #888; background: rgba(255,255,255,0.85);
    padding: 3px 6px; border-radius: 3px;
    pointer-events: none;
  }
  .slide[data-max-step="0"] .step-badge { display: none; }
</style>
</head>
<body>
${slidesHtml}
<script>
  const slides = Array.from(document.querySelectorAll('.slide'));
  let focused = slides[0] ?? null;

  function applySteps(slide) {
    const cur = +slide.dataset.currentStep;
    slide.querySelectorAll('[data-step]').forEach((el) => {
      const st = +el.dataset.step;
      el.classList.toggle('stepped-hidden', st > cur);
    });
    const max = +slide.dataset.maxStep;
    const badge = slide.querySelector('.step-badge');
    if (badge) badge.textContent = max > 0 ? ('step ' + cur + ' / ' + max) : '';
  }

  function setFocused(s) {
    if (focused) focused.classList.remove('focused');
    focused = s;
    if (focused) focused.classList.add('focused');
  }

  slides.forEach((s) => {
    s.addEventListener('click', () => setFocused(s));
    applySteps(s);
  });
  if (focused) focused.classList.add('focused');

  document.addEventListener('keydown', (e) => {
    if (!focused) return;
    if (e.key === 'ArrowRight') {
      const cur = +focused.dataset.currentStep;
      const max = +focused.dataset.maxStep;
      if (cur < max) {
        focused.dataset.currentStep = String(cur + 1);
        applySteps(focused);
        e.preventDefault();
      }
    } else if (e.key === 'ArrowLeft') {
      const cur = +focused.dataset.currentStep;
      if (cur > 0) {
        focused.dataset.currentStep = String(cur - 1);
        applySteps(focused);
        e.preventDefault();
      }
    } else if (e.key === '0') {
      focused.dataset.currentStep = '0';
      applySteps(focused);
    } else if (e.key === 'End') {
      focused.dataset.currentStep = focused.dataset.maxStep;
      applySteps(focused);
    }
  });

  const sse = new EventSource("/sse");
  sse.onmessage = (e) => { if (e.data === "reload") location.reload(); };
</script>
</body>
</html>`;
}
function bgToCss(bg) {
  if (bg === undefined)
    return "";
  if (typeof bg === "string")
    return `background-color:${escapeAttr(bg)};`;
  return `background-image:url(${JSON.stringify(bg.image)});`;
}
function maxStepOf(p) {
  if (p.kind === "bullets") {
    return p.bullets.reduce((m, b) => Math.max(m, b.step), p.step);
  }
  return p.step;
}
function placedToHtml(p, theme) {
  const inset = `left:${p.x * SCALE}px;top:${p.y * SCALE}px;width:${p.w * SCALE}px;height:${p.h * SCALE}px`;
  if (p.kind === "image") {
    const fitClass = p.fit === "cover" ? " fit-cover" : p.fit === "fill" ? " fit-fill" : "";
    return `<img class="placed${fitClass}" data-step="${p.step}" src="${escapeAttr(p.src)}" alt="${escapeAttr(p.alt ?? "")}" style="${inset}">`;
  }
  if (p.kind === "bullets") {
    const lis = p.bullets.map((b) => {
      const a = b.align && TEXT_ALIGN[b.align] ? `text-align:${TEXT_ALIGN[b.align]};` : "";
      return `<li data-step="${b.step}" style="${a}">${runsToHtml(b.runs, "bullet", theme)}</li>`;
    }).join("");
    return `<ul class="placed bullets" data-step="${p.step}" style="${inset}">${lis}</ul>`;
  }
  const ta = p.align && TEXT_ALIGN[p.align] ? `text-align:${TEXT_ALIGN[p.align]};` : "";
  return `<div class="placed role-${p.role}" data-step="${p.step}" style="${inset}${ta}">${runsToHtml(p.runs, p.role, theme)}</div>`;
}
function runsToHtml(runs, role, theme) {
  return runs.map((r) => {
    const text = escapeText(r.text).replace(/\n/g, "<br/>");
    const css = runStyleCss(r.style, role, theme);
    if (!css)
      return text;
    return `<span style="${css}">${text}</span>`;
  }).join("");
}
function runStyleCss(style, role, theme) {
  if (!style)
    return "";
  const parts = [];
  const base = ROLE_STYLES[role].fontSize;
  let size;
  if (style.size !== undefined) {
    size = typeof style.size === "number" ? style.size : base * SIZE_TOKENS[style.size];
  }
  if (style.cite) {
    size = (size ?? base) * 0.75;
  }
  if (size !== undefined)
    parts.push(`font-size:${size}px`);
  if (style.weight !== undefined)
    parts.push(`font-weight:${style.weight}`);
  if (style.italic)
    parts.push(`font-style:italic`);
  if (style.font)
    parts.push(`font-family:${style.font}`);
  let color = style.color;
  if (style.cite && !color && theme.accent)
    color = theme.accent;
  if (color)
    parts.push(`color:${color}`);
  return parts.join(";");
}
function escapeText(s) {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] ?? c);
}
function escapeAttr(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}

// src/load.ts
import { pathToFileURL } from "url";
async function loadDeck(entry) {
  const url = pathToFileURL(entry).href + `?t=${Date.now()}`;
  const mod = await import(url);
  const deckFn = mod.default;
  if (typeof deckFn !== "function") {
    throw new Error(`deck entry must default-export a function returning Slide[] or { theme?, slides }: ${entry}`);
  }
  const result = await deckFn();
  return normalizeResult(result);
}
function normalizeResult(result) {
  if (Array.isArray(result)) {
    const slides = flattenSlides(result);
    assertSlides(slides);
    return { slides };
  }
  if (result && typeof result === "object" && "slides" in result) {
    const r = result;
    if (!Array.isArray(r.slides)) {
      throw new Error(`deck object's "slides" property must be an array of <Slide> elements`);
    }
    const slides = flattenSlides(r.slides);
    assertSlides(slides);
    return { theme: r.theme, slides };
  }
  throw new Error(`deck function must return an array of <Slide> elements or { theme?, slides }`);
}
function flattenSlides(input) {
  const out = [];
  function visit(c) {
    if (c == null || c === false || c === true)
      return;
    if (Array.isArray(c)) {
      for (const x of c)
        visit(x);
      return;
    }
    out.push(c);
  }
  visit(input);
  return out;
}
function assertSlides(arr) {
  for (const s of arr) {
    if (!s || typeof s !== "object" || s.kind !== "slide") {
      throw new Error("deck array must contain only <Slide> elements");
    }
  }
}

// src/slides_client.ts
import { google as google2 } from "googleapis";
async function getClients() {
  const auth = await getAuthedClient();
  return {
    auth,
    slides: google2.slides({ version: "v1", auth }),
    drive: google2.drive({ version: "v3", auth })
  };
}
function parsePresentationId(input) {
  const m = /\/presentation\/d\/([a-zA-Z0-9_-]+)/.exec(input);
  if (m)
    return m[1];
  return input;
}
function presentationUrl(id) {
  return `https://docs.google.com/presentation/d/${id}/edit`;
}

// src/slides_reader.ts
function presentationToDeck(p) {
  const slides = p.slides ?? [];
  const pageW = p.pageSize?.width?.magnitude ?? 0;
  const pageH = p.pageSize?.height?.magnitude ?? 0;
  const theme = inferTheme(p);
  const slideNodes = slides.map((s) => slideToNode(s, pageW, pageH, theme));
  const result = { slides: slideNodes };
  if (Object.keys(theme).length > 0)
    result.theme = theme;
  return result;
}
function slideToNode(slide, pageW, pageH, theme) {
  const elements = (slide.pageElements ?? []).slice().sort((a, b) => yOf(a) - yOf(b));
  let background;
  const contentEls = [];
  for (const el of elements) {
    if (isFullPageImage(el, pageW, pageH)) {
      const url = el.image?.sourceUrl ?? el.image?.contentUrl;
      if (url && background === undefined) {
        background = { image: url };
        continue;
      }
    }
    contentEls.push(el);
  }
  const bgFill = slide.pageProperties?.pageBackgroundFill;
  if (background === undefined && bgFill) {
    const rgb = bgFill.solidFill?.color?.rgbColor;
    if (rgb) {
      const hex = rgbToHex(rgb);
      if (hex && hex !== theme.background)
        background = hex;
    } else if (bgFill.stretchedPictureFill?.contentUrl) {
      background = { image: bgFill.stretchedPictureFill.contentUrl };
    }
  }
  const children = [];
  for (const el of contentEls) {
    const child = elementToChild(el);
    if (child)
      children.push(child);
  }
  const node = { kind: "slide", children };
  if (background !== undefined)
    node.background = background;
  return node;
}
function isFullPageImage(el, pageW, pageH) {
  if (!el.image)
    return false;
  if (pageW <= 0 || pageH <= 0)
    return false;
  const w = el.size?.width?.magnitude;
  const h = el.size?.height?.magnitude;
  const sx = el.transform?.scaleX ?? 1;
  const sy = el.transform?.scaleY ?? 1;
  const tx = el.transform?.translateX ?? 0;
  const ty = el.transform?.translateY ?? 0;
  if (!w || !h)
    return false;
  const rw = w * sx;
  const rh = h * sy;
  const tol = 0.02;
  if (Math.abs(tx) > pageW * tol)
    return false;
  if (Math.abs(ty) > pageH * tol)
    return false;
  if (Math.abs(rw - pageW) > pageW * tol)
    return false;
  if (Math.abs(rh - pageH) > pageH * tol)
    return false;
  return true;
}
function yOf(el) {
  return el.transform?.translateY ?? 0;
}
function elementToChild(el) {
  if (el.image?.contentUrl || el.image?.sourceUrl) {
    const node = {
      kind: "image",
      src: el.image.sourceUrl ?? el.image.contentUrl ?? ""
    };
    return node;
  }
  if (!el.shape?.text)
    return null;
  const paragraphs = parseParagraphs(el.shape.text);
  if (paragraphs.length === 0)
    return null;
  const allBullets = paragraphs.every((p) => p.bullet);
  if (allBullets && paragraphs.length > 0) {
    const bullets = paragraphs.map((p) => ({
      kind: "bullet",
      runs: collapseRuns(p.runs, p.dominant)
    }));
    const node = { kind: "bullets", children: bullets };
    return node;
  }
  const allRuns = [];
  for (let i = 0;i < paragraphs.length; i++) {
    const p = paragraphs[i];
    allRuns.push(...p.runs);
    if (i < paragraphs.length - 1)
      allRuns.push({ text: `
` });
  }
  const dominant = paragraphs[0].dominant;
  const runs = collapseRuns(allRuns, dominant);
  const text = runs.map((r) => r.text).join("");
  if (!text.trim())
    return null;
  const role = classifyText(dominant);
  switch (role) {
    case "title":
      return { kind: "title", runs };
    case "subtitle":
      return { kind: "subtitle", runs };
    case "heading":
      return { kind: "heading", runs };
    default:
      return { kind: "text", runs };
  }
}
function parseParagraphs(text) {
  const elements = text.textElements ?? [];
  const paragraphs = [];
  let currentRuns = [];
  let currentBullet = false;
  let dominant = {};
  function flush() {
    if (currentRuns.length === 0)
      return;
    paragraphs.push({ bullet: currentBullet, runs: currentRuns, dominant });
    currentRuns = [];
    dominant = {};
  }
  for (const e of elements) {
    if (e.paragraphMarker) {
      flush();
      currentBullet = !!e.paragraphMarker.bullet;
    } else if (e.textRun) {
      const content = e.textRun.content ?? "";
      const raw = textRunStyle(e.textRun.style ?? {});
      if (Object.keys(dominant).length === 0)
        dominant = raw;
      const lines = content.split(`
`);
      lines.forEach((line, i) => {
        if (line.length > 0) {
          currentRuns.push(toRun(line, raw));
        }
        if (i < lines.length - 1) {
          flush();
          currentBullet = currentBullet;
        }
      });
    }
  }
  flush();
  return paragraphs.filter((p) => p.runs.some((r) => r.text.length > 0));
}
function textRunStyle(style) {
  const out = {};
  if (style.fontSize?.magnitude)
    out.fontSize = style.fontSize.magnitude;
  if (style.bold)
    out.bold = true;
  if (style.italic)
    out.italic = true;
  if (style.fontFamily)
    out.fontFamily = style.fontFamily;
  const rgb = style.foregroundColor?.opaqueColor?.rgbColor;
  if (rgb) {
    const hex = rgbToHex(rgb);
    if (hex)
      out.color = hex;
  }
  return out;
}
function toRun(text, raw) {
  const style = {};
  if (raw.fontSize !== undefined)
    style.size = raw.fontSize;
  if (raw.bold)
    style.weight = 700;
  if (raw.italic)
    style.italic = true;
  if (raw.fontFamily)
    style.font = raw.fontFamily;
  if (raw.color)
    style.color = raw.color;
  if (Object.keys(style).length === 0)
    return { text };
  return { text, style };
}
function collapseRuns(runs, dominant) {
  const out = [];
  for (const r of runs) {
    const filtered = filterToOverrides(r.style, dominant);
    const stripped = filtered ? { text: r.text, style: filtered } : { text: r.text };
    const last = out[out.length - 1];
    if (last && sameStyle(last.style, stripped.style)) {
      last.text += stripped.text;
    } else {
      out.push(stripped);
    }
  }
  return out;
}
function filterToOverrides(style, dominant) {
  if (!style)
    return;
  const out = {};
  if (style.size !== undefined && style.size !== dominant.fontSize)
    out.size = style.size;
  if (style.weight !== undefined && style.weight === 700 !== !!dominant.bold)
    out.weight = style.weight;
  if (style.italic !== undefined && !!style.italic !== !!dominant.italic)
    out.italic = style.italic;
  if (style.font !== undefined && style.font !== dominant.fontFamily)
    out.font = style.font;
  if (style.color !== undefined && style.color !== dominant.color)
    out.color = style.color;
  return Object.keys(out).length === 0 ? undefined : out;
}
function sameStyle(a, b) {
  if (!a && !b)
    return true;
  if (!a || !b)
    return false;
  return a.size === b.size && a.weight === b.weight && a.italic === b.italic && a.font === b.font && a.color === b.color;
}
function classifyText(style) {
  const size = style.fontSize ?? 14;
  if (style.bold && size >= 30)
    return "title";
  if (style.bold)
    return "heading";
  if (size >= 20)
    return "subtitle";
  return "text";
}
function rgbToHex(rgb) {
  const r = Math.round((rgb.red ?? 0) * 255);
  const g = Math.round((rgb.green ?? 0) * 255);
  const b = Math.round((rgb.blue ?? 0) * 255);
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}
function inferTheme(p) {
  const theme = {};
  const masterBg = (p.masters ?? []).map((m) => m.pageProperties?.pageBackgroundFill?.solidFill?.color?.rgbColor).find((c) => c !== undefined);
  if (masterBg) {
    const hex = rgbToHex(masterBg);
    if (hex)
      theme.background = hex;
  }
  const colors = [];
  const fonts = [];
  for (const slide of p.slides ?? []) {
    for (const el of slide.pageElements ?? []) {
      const els = el.shape?.text?.textElements ?? [];
      for (const e of els) {
        const s = e.textRun?.style;
        if (!s)
          continue;
        const rgb = s.foregroundColor?.opaqueColor?.rgbColor;
        if (rgb) {
          const hex = rgbToHex(rgb);
          if (hex)
            colors.push(hex);
        }
        if (s.fontFamily)
          fonts.push(s.fontFamily);
      }
    }
  }
  const modeColor = mode(colors);
  if (modeColor)
    theme.text = modeColor;
  const modeFont = mode(fonts);
  if (modeFont)
    theme.fonts = { body: modeFont };
  return theme;
}
function mode(arr) {
  if (arr.length === 0)
    return;
  const counts = new Map;
  for (const v of arr)
    counts.set(v, (counts.get(v) ?? 0) + 1);
  let best;
  let bestCount = 0;
  for (const [v, c] of counts) {
    if (c > bestCount) {
      best = v;
      bestCount = c;
    }
  }
  return best;
}
function deckToTsx(deck) {
  const used = new Set(["Slide"]);
  const slidesSrc = deck.slides.map((s) => renderSlide(s, used)).join(`,
    `);
  const themeSrc = deck.theme && Object.keys(deck.theme).length > 0 ? `const theme = ${stringifyTheme(deck.theme)};

` : "";
  const returnExpr = deck.theme && Object.keys(deck.theme).length > 0 ? `{ theme, slides: [
    ${slidesSrc},
  ] }` : `[
    ${slidesSrc},
  ]`;
  const imports = Array.from(used).sort().join(", ");
  return `import { ${imports} } from "slidekick";

export default function deck() {
  ${themeSrc.trim()}${themeSrc ? `

  ` : ""}return ${returnExpr};
}
`;
}
function stringifyTheme(theme) {
  return JSON.stringify(theme, null, 2).replace(/\n/g, `
  `);
}
function renderSlide(slide, used) {
  const props = [];
  if (slide.background !== undefined) {
    if (typeof slide.background === "string") {
      props.push(` background=${JSON.stringify(slide.background)}`);
    } else {
      props.push(` background={{ image: ${JSON.stringify(slide.background.image)} }}`);
    }
  }
  if (slide.align)
    props.push(` align=${JSON.stringify(slide.align)}`);
  const open = `<Slide${props.join("")}>`;
  if (slide.children.length === 0) {
    return `<Slide${props.join("")} />`;
  }
  const body = slide.children.map((c) => renderChild(c, used, "      ")).join(`
`);
  return `${open}
${body}
    </Slide>`;
}
function renderChild(node, used, indent) {
  switch (node.kind) {
    case "title":
      used.add("Title");
      return `${indent}<Title>${renderRuns(node.runs, used)}</Title>`;
    case "subtitle":
      used.add("Subtitle");
      return `${indent}<Subtitle>${renderRuns(node.runs, used)}</Subtitle>`;
    case "heading":
      used.add("Heading");
      return `${indent}<Heading>${renderRuns(node.runs, used)}</Heading>`;
    case "text":
      used.add("Text");
      return `${indent}<Text>${renderRuns(node.runs, used)}</Text>`;
    case "image": {
      used.add("Image");
      const alt = node.alt ? ` alt=${JSON.stringify(node.alt)}` : "";
      const fit = node.fit && node.fit !== "contain" ? ` fit=${JSON.stringify(node.fit)}` : "";
      return `${indent}<Image src=${JSON.stringify(node.src)}${alt}${fit} />`;
    }
    case "bullets": {
      used.add("Bullets");
      used.add("Bullet");
      const items = node.children.map((b) => `${indent}  <Bullet>${renderRuns(b.runs, used)}</Bullet>`).join(`
`);
      return `${indent}<Bullets>
${items}
${indent}</Bullets>`;
    }
    case "columns": {
      used.add("Columns");
      used.add("Column");
      const cols = node.children.map((c) => {
        const inner = c.children.map((cc) => renderChild(cc, used, `${indent}    `)).join(`
`);
        const w = c.weight ? ` weight={${c.weight}}` : "";
        return `${indent}  <Column${w}>
${inner}
${indent}  </Column>`;
      }).join(`
`);
      return `${indent}<Columns>
${cols}
${indent}</Columns>`;
    }
    case "group": {
      used.add("Group");
      const inner = node.children.map((c) => renderChild(c, used, `${indent}  `)).join(`
`);
      return `${indent}<Group>
${inner}
${indent}</Group>`;
    }
  }
}
function renderRuns(runs, used) {
  return runs.map((r) => {
    const text = escapeJsxText(r.text);
    if (!r.style)
      return text;
    used.add("Span");
    const attrs = [];
    if (r.style.size !== undefined) {
      attrs.push(typeof r.style.size === "number" ? `size={${r.style.size}}` : `size=${JSON.stringify(r.style.size)}`);
    }
    if (r.style.weight !== undefined)
      attrs.push(`weight={${r.style.weight}}`);
    if (r.style.italic)
      attrs.push(`italic`);
    if (r.style.font)
      attrs.push(`font=${JSON.stringify(r.style.font)}`);
    if (r.style.color)
      attrs.push(`color=${JSON.stringify(r.style.color)}`);
    return `<Span ${attrs.join(" ")}>${text}</Span>`;
  }).join("");
}
function escapeJsxText(s) {
  return s.replace(/[{}<>]/g, (c) => `{${JSON.stringify(c)}}`);
}

// src/slides_writer.ts
var DEFAULT_PAGE = { widthPt: SLIDE_W * 72, heightPt: SLIDE_H * 72 };
var DEFAULT_ROLE_STYLE = {
  title: { fontSize: 36, bold: true },
  subtitle: { fontSize: 22 },
  heading: { fontSize: 22, bold: true },
  text: { fontSize: 16 },
  bullet: { fontSize: 18 }
};
var PARAGRAPH_ALIGN = {
  start: "START",
  center: "CENTER",
  end: "END"
};
var SIZE_TOKENS2 = { sm: 0.85, md: 1, lg: 1.25 };
function normalizeDeck(input) {
  if (Array.isArray(input))
    return { theme: {}, slides: input };
  return { theme: input.theme ?? {}, slides: input.slides };
}
function deckToRequests(input, opts = {}) {
  const { theme, slides } = normalizeDeck(input);
  const page = opts.page ?? DEFAULT_PAGE;
  const sx = page.widthPt / SLIDE_W;
  const sy = page.heightPt / SLIDE_H;
  const layouts = layoutDeck(slides);
  const requests = [];
  layouts.forEach((slideLayout, slideIdx) => {
    const slideId = `sk_s_${slideIdx}`;
    requests.push({
      createSlide: {
        objectId: slideId,
        slideLayoutReference: { predefinedLayout: "BLANK" }
      }
    });
    const bg = slideLayout.background ?? theme.background;
    if (bg !== undefined)
      emitPageBackground(requests, slideId, bg);
    slideLayout.placed.forEach((p, i) => {
      const elementId = `sk_e_${slideIdx}_${i}`;
      const x = p.x * sx;
      const y = p.y * sy;
      const w = p.w * sx;
      const h = p.h * sy;
      emitElement(requests, slideId, elementId, p, x, y, w, h, theme);
    });
  });
  return requests;
}
function emitPageBackground(out, slideId, bg) {
  if (typeof bg === "string") {
    const color = parseColor(bg);
    if (!color)
      return;
    out.push({
      updatePageProperties: {
        objectId: slideId,
        pageProperties: {
          pageBackgroundFill: {
            solidFill: { color: { rgbColor: color }, alpha: 1 }
          }
        },
        fields: "pageBackgroundFill.solidFill.color,pageBackgroundFill.solidFill.alpha"
      }
    });
    return;
  }
  out.push({
    updatePageProperties: {
      objectId: slideId,
      pageProperties: {
        pageBackgroundFill: {
          stretchedPictureFill: { contentUrl: bg.image }
        }
      },
      fields: "pageBackgroundFill.stretchedPictureFill.contentUrl"
    }
  });
}
function emitElement(out, slideId, elementId, p, x, y, w, h, theme) {
  const elementProperties = {
    pageObjectId: slideId,
    size: {
      width: { magnitude: w, unit: "PT" },
      height: { magnitude: h, unit: "PT" }
    },
    transform: { scaleX: 1, scaleY: 1, translateX: x, translateY: y, unit: "PT" }
  };
  if (p.kind === "image") {
    out.push({ createImage: { objectId: elementId, url: p.src, elementProperties } });
    if (p.crop)
      emitCrop(out, elementId, p.crop);
    return;
  }
  out.push({
    createShape: { objectId: elementId, shapeType: "TEXT_BOX", elementProperties }
  });
  if (p.kind === "text") {
    emitRuns(out, elementId, p.runs, p.role, theme, p.align);
    return;
  }
  emitBullets(out, elementId, p.bullets, theme);
}
function emitRuns(out, elementId, runs, role, theme, paragraphAlign) {
  const text = runs.map((r) => r.text).join("");
  if (text.length === 0)
    return;
  out.push({ insertText: { objectId: elementId, text, insertionIndex: 0 } });
  if (paragraphAlign && PARAGRAPH_ALIGN[paragraphAlign]) {
    out.push({
      updateParagraphStyle: {
        objectId: elementId,
        style: { alignment: PARAGRAPH_ALIGN[paragraphAlign] },
        fields: "alignment",
        textRange: { type: "ALL" }
      }
    });
  }
  let cursor = 0;
  for (const run of runs) {
    const len = run.text.length;
    if (len > 0) {
      const merged = mergeStyles(role, theme, run.style);
      pushTextStyle(out, elementId, merged, cursor, cursor + len);
    }
    cursor += len;
  }
}
function emitBullets(out, elementId, bullets, theme) {
  const lineTexts = bullets.map((b) => b.runs.map((r) => r.text).join(""));
  const text = lineTexts.join(`
`);
  if (text.length === 0)
    return;
  out.push({ insertText: { objectId: elementId, text, insertionIndex: 0 } });
  let cursor = 0;
  for (let i = 0;i < bullets.length; i++) {
    const b = bullets[i];
    const lineLen = lineTexts[i].length;
    if (b.align && PARAGRAPH_ALIGN[b.align]) {
      out.push({
        updateParagraphStyle: {
          objectId: elementId,
          style: { alignment: PARAGRAPH_ALIGN[b.align] },
          fields: "alignment",
          textRange: { type: "FIXED_RANGE", startIndex: cursor, endIndex: cursor + lineLen }
        }
      });
    }
    for (const run of b.runs) {
      const len = run.text.length;
      if (len > 0) {
        const merged = mergeStyles("bullet", theme, run.style);
        pushTextStyle(out, elementId, merged, cursor, cursor + len);
      }
      cursor += len;
    }
    if (i < bullets.length - 1)
      cursor += 1;
  }
  out.push({
    createParagraphBullets: {
      objectId: elementId,
      textRange: { type: "ALL" },
      bulletPreset: "BULLET_DISC_CIRCLE_SQUARE"
    }
  });
}
function roleBaseStyle(role, theme) {
  const base = DEFAULT_ROLE_STYLE[role];
  const sizeOverride = theme.sizes?.[role];
  return { ...base, fontSize: sizeOverride ?? base.fontSize };
}
function mergeStyles(role, theme, run) {
  const base = roleBaseStyle(role, theme);
  const isDisplay = role === "title" || role === "heading";
  const themeFont = isDisplay ? theme.fonts?.display ?? theme.fonts?.body : theme.fonts?.body;
  const themeColor = theme.text;
  let fontSize = base.fontSize;
  let bold = !!base.bold;
  let italic = !!base.italic;
  let font = themeFont;
  let color = themeColor;
  if (run) {
    if (run.size !== undefined) {
      fontSize = resolveSize(run.size, base.fontSize);
    }
    if (run.weight !== undefined)
      bold = run.weight >= 700;
    if (run.italic !== undefined)
      italic = run.italic;
    if (run.font !== undefined)
      font = run.font;
    if (run.color !== undefined)
      color = run.color;
    if (run.cite) {
      fontSize = fontSize * 0.75;
      if (run.color === undefined && theme.accent)
        color = theme.accent;
    }
  }
  return { fontSize, bold, italic, font, color };
}
function resolveSize(size, base) {
  if (typeof size === "number")
    return size;
  const factor = SIZE_TOKENS2[size];
  return base * factor;
}
function pushTextStyle(out, objectId, style, startIndex, endIndex) {
  const fields = ["fontSize", "bold", "italic"];
  const textStyle = {
    fontSize: { magnitude: style.fontSize, unit: "PT" },
    bold: style.bold,
    italic: style.italic
  };
  if (style.font) {
    textStyle.fontFamily = style.font;
    fields.push("fontFamily");
  }
  if (style.color) {
    const rgb = parseColor(style.color);
    if (rgb) {
      textStyle.foregroundColor = { opaqueColor: { rgbColor: rgb } };
      fields.push("foregroundColor");
    }
  }
  out.push({
    updateTextStyle: {
      objectId,
      style: textStyle,
      fields: fields.join(","),
      textRange: { type: "FIXED_RANGE", startIndex, endIndex }
    }
  });
}
function emitCrop(out, objectId, crop) {
  out.push({
    updateImageProperties: {
      objectId,
      imageProperties: {
        cropProperties: {
          leftOffset: crop.left ?? 0,
          rightOffset: crop.right ?? 0,
          topOffset: crop.top ?? 0,
          bottomOffset: crop.bottom ?? 0
        }
      },
      fields: "cropProperties.leftOffset,cropProperties.rightOffset,cropProperties.topOffset,cropProperties.bottomOffset"
    }
  });
}
function parseColor(c) {
  let s = c.trim();
  if (s.startsWith("#"))
    s = s.slice(1);
  if (/^[0-9a-fA-F]{3}$/.test(s)) {
    s = s.split("").map((ch) => ch + ch).join("");
  }
  if (/^[0-9a-fA-F]{6}$/.test(s)) {
    return {
      red: parseInt(s.slice(0, 2), 16) / 255,
      green: parseInt(s.slice(2, 4), 16) / 255,
      blue: parseInt(s.slice(4, 6), 16) / 255
    };
  }
  return null;
}
function deleteAllSlidesRequests(presentation) {
  const slides = presentation.slides ?? [];
  return slides.map((s) => s.objectId).filter((id) => typeof id === "string").map((objectId) => ({ deleteObject: { objectId } }));
}
function presentationPageDims(p) {
  const size = p.pageSize;
  const w = size?.width;
  const h = size?.height;
  if (!w?.magnitude || !h?.magnitude)
    return DEFAULT_PAGE;
  const widthPt = toPt(w.magnitude, w.unit ?? "EMU");
  const heightPt = toPt(h.magnitude, h.unit ?? "EMU");
  return { widthPt, heightPt };
}
function toPt(magnitude, unit) {
  if (unit === "PT")
    return magnitude;
  if (unit === "EMU")
    return magnitude / 12700;
  return magnitude;
}

// src/cli.ts
var program2 = new Command;
program2.name("slidekick").description("Author Google Slides decks as TSX. Push and pull from real presentations.").version("0.1.0");
var auth = program2.command("auth").description("Authentication");
auth.command("login").description("Run the OAuth flow and cache credentials").action(async () => {
  try {
    await login();
  } catch (e) {
    console.error(`Auth failed: ${e.message}
`);
    console.error(missingScopeHelp());
    process.exit(1);
  }
});
auth.command("status").description("Show whether credentials are cached").action(async () => {
  try {
    await getClients();
    console.log(`Authenticated. Token cached at ${tokenPath()}.`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
});
program2.command("init").description("Scaffold a new slidekick deck project").argument("[dir]", "directory to create (defaults to current dir)").action(async (dir) => {
  const target = resolve(process.cwd(), dir ?? ".");
  await mkdir2(target, { recursive: true });
  const deckPath = join2(target, "deck.tsx");
  if (await fileExists(deckPath)) {
    console.error(`refusing to overwrite existing deck.tsx in ${target}`);
    process.exit(1);
  }
  await writeFile2(deckPath, STARTER_DECK);
  await writeFile2(join2(target, "tsconfig.json"), STARTER_TSCONFIG);
  await writeFile2(join2(target, "package.json"), starterPackageJson(basename(target)));
  await writeFile2(join2(target, ".gitignore"), STARTER_GITIGNORE);
  console.log(`scaffolded slidekick deck in ${target}`);
  console.log("");
  console.log("next:");
  console.log(`  cd ${dir ?? "."}`);
  console.log("  bun install");
  console.log("  slidekick auth login");
  console.log("  slidekick dev                            # local preview");
  console.log('  slidekick new deck.tsx --title "My Deck" # create on Slides');
});
program2.command("dev").description("Start a local HTML preview while editing").option("-p, --port <port>", "port to serve on", "5179").option("-e, --entry <entry>", "deck entry file", "deck.tsx").action(async (options) => {
  const entry = resolve(process.cwd(), options.entry);
  const port = Number(options.port);
  if (!await fileExists(entry)) {
    console.error(`deck entry not found: ${entry}`);
    console.error(`run \`slidekick init\` first, or pass --entry`);
    process.exit(1);
  }
  const sseControllers = new Set;
  const encoder = new TextEncoder;
  const server = Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url);
      if (url.pathname === "/sse") {
        const stream = makeSseStream(sseControllers, encoder);
        return new Response(stream, {
          headers: {
            "content-type": "text/event-stream",
            "cache-control": "no-cache",
            connection: "keep-alive"
          }
        });
      }
      try {
        const deck = await loadDeck(entry);
        return new Response(renderHtml(deck), {
          headers: { "content-type": "text/html; charset=utf-8" }
        });
      } catch (err) {
        const stack = err instanceof Error ? err.stack ?? err.message : String(err);
        return new Response(errorPage(stack), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" }
        });
      }
    }
  });
  const watchDir = dirname2(entry);
  watch(watchDir, { recursive: true }, () => {
    const data = encoder.encode(`data: reload

`);
    for (const c of sseControllers) {
      try {
        c.enqueue(data);
      } catch {
        sseControllers.delete(c);
      }
    }
  });
  console.log(`slidekick dev: ${server.url.href}`);
  console.log(`watching ${watchDir}`);
});
program2.command("new").description("Create a new Google Slides presentation from a deck file").argument("<entry>", "deck entry file").requiredOption("--title <title>", "title for the new presentation").action(async (entry, opts) => {
  const entryPath = resolve(process.cwd(), entry);
  const deck = await loadDeck(entryPath);
  const { slides } = await getClients();
  const created = await slides.presentations.create({
    requestBody: {
      title: opts.title,
      pageSize: {
        width: { magnitude: 12192000, unit: "EMU" },
        height: { magnitude: 6858000, unit: "EMU" }
      }
    }
  });
  const id = created.data.presentationId;
  if (!id)
    throw new Error("Failed to create presentation");
  const deletes = deleteAllSlidesRequests(created.data);
  const writes = deckToRequests(deck, { page: presentationPageDims(created.data) });
  await slides.presentations.batchUpdate({
    presentationId: id,
    requestBody: { requests: [...deletes, ...writes] }
  });
  console.log(`${presentationUrl(id)}  (${opts.title})`);
});
program2.command("push").description("Overwrite an existing Google Slides deck").argument("<entry>", "deck entry file").requiredOption("--id <id>", "target presentation ID or URL").option("--dry-run", "print the batchUpdate requests, don't send").action(async (entry, opts) => {
  const entryPath = resolve(process.cwd(), entry);
  const deck = await loadDeck(entryPath);
  const id = parsePresentationId(opts.id);
  if (opts.dryRun) {
    const reqs = deckToRequests(deck);
    console.log(JSON.stringify(reqs, null, 2));
    return;
  }
  const { slides } = await getClients();
  const existing = await slides.presentations.get({ presentationId: id });
  const deletes = deleteAllSlidesRequests(existing.data);
  const writes = deckToRequests(deck, { page: presentationPageDims(existing.data) });
  await slides.presentations.batchUpdate({
    presentationId: id,
    requestBody: { requests: [...deletes, ...writes] }
  });
  console.error(`Pushed ${entry} to ${presentationUrl(id)}`);
});
program2.command("pull").description("Download a Google Slides deck and convert to TSX").argument("<idOrUrl>", "presentation ID or URL").option("-o, --output <file>", "write to file instead of stdout").action(async (input, opts) => {
  const id = parsePresentationId(input);
  const { slides } = await getClients();
  const res = await slides.presentations.get({ presentationId: id });
  const deck = presentationToDeck(res.data);
  const tsx = deckToTsx(deck);
  if (opts.output) {
    await writeFile2(opts.output, tsx);
    console.error(`Wrote ${opts.output}`);
  } else {
    process.stdout.write(tsx);
  }
});
program2.command("agent").description("Print agent-friendly instructions for authoring a deck").action(() => {
  process.stdout.write(AGENT_INSTRUCTIONS);
});
program2.parseAsync(process.argv).catch((e) => {
  console.error(`Error: ${e.message}`);
  if (/insufficient|invalid_scope|forbidden/i.test(e.message)) {
    console.error(`
${missingScopeHelp()}`);
  }
  process.exit(1);
});
async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
function makeSseStream(controllers, encoder) {
  let registered = null;
  return new ReadableStream({
    start(controller) {
      registered = controller;
      controllers.add(controller);
      controller.enqueue(encoder.encode(`:

`));
    },
    cancel() {
      if (registered)
        controllers.delete(registered);
    }
  });
}
function errorPage(stack) {
  const escaped = stack.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] ?? c);
  return `<!doctype html><html><body style="margin:0;background:#1a1a1a;color:#f55;font-family:ui-monospace,monospace">
<pre style="padding:24px;white-space:pre-wrap">${escaped}</pre>
<script>const sse=new EventSource("/sse");sse.onmessage=(e)=>{if(e.data==="reload")location.reload();};</script>
</body></html>`;
}
var STARTER_DECK = `import { Slide, Title, Subtitle, Bullets, Bullet } from "slidekick";

export default function deck() {
  return [
    <Slide>
      <Title>Hello, slidekick</Title>
      <Subtitle>Author decks as TSX. Push to Google Slides.</Subtitle>
    </Slide>,
    <Slide>
      <Title>Why slidekick</Title>
      <Bullets>
        <Bullet>Slides are code, diffable and reviewable</Bullet>
        <Bullet>An AI sidekick can author and revise them</Bullet>
        <Bullet>Pushed to a real Google Slides deck \u2014 fully editable</Bullet>
      </Bullets>
    </Slide>,
  ];
}
`;
var STARTER_TSCONFIG = `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "jsx": "react-jsx",
    "jsxImportSource": "slidekick",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["**/*.ts", "**/*.tsx"]
}
`;
function starterPackageJson(name) {
  const safeName = name.replace(/[^a-z0-9-_]/gi, "-").toLowerCase() || "deck";
  return `{
  "name": "${safeName}",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "slidekick dev"
  },
  "dependencies": {
    "slidekick": "github:bhirsch42/slidekick"
  }
}
`;
}
var STARTER_GITIGNORE = `node_modules
.DS_Store
`;
