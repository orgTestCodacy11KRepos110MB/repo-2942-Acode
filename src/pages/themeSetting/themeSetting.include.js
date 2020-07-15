import tag from "html-tag-js";
import mustache from 'mustache';

import Page from "../../components/page";
import constants from "../../lib/constants";

import $_template from './themeSetting.hbs';
import $_list_item from './list-item.hbs';

import searchBar from "../../components/searchbar";
import './themeSetting.scss';

export default function () {
  const $page = Page(strings.theme);
  const $container = tag.parse($_template, {});
  const $search = tag('i', {
    className: 'icon search',
    attr: {
      action: 'search'
    }
  });
  const $themePreview = tag("div", {
    id: "theme-preview"
  });
  let editor = ace.edit($themePreview);

  editor.setTheme(appSettings.value.editorTheme);
  editor.setFontSize(appSettings.value.fontSize);
  editor.session.setOptions({
    mode: "ace/mode/javascript"
  });
  editor.setReadOnly(true);
  editor.session.setValue("function foo(){\n" +
    "\tconst array = [1, 1, 2, 3, 5, 5, 1];\n" +
    "\tconst uniqueArray = [...new Set(array)];\n" +
    "\tconsole.log(uniqueArray);\n" +
    "\tconsole.log(0.2 + 0.1 === 0.3);\n" +
    "\tconsole.log('I love Acode editor')\n" +
    "}\n" +
    "foo();");
  editor.gotoLine(8);
  $themePreview.append(tag("div", {
    id: "theme-preview-header"
  }));
  $themePreview.classList.add(appSettings.value.editorFont);

  actionStack.push({
    id: "appTheme",
    action: () => {
      editor.destroy();
      $page.hide();
      $page.removeEventListener("click", clickHandler);
    }
  });

  $page.onhide = () => actionStack.remove("appTheme");
  $page.append($container);
  $page.querySelector('header').append($search);

  app.append($page);

  $page.addEventListener("click", clickHandler);
  render();

  function render(mode = "app") {
    let themeList = [];
    let defaultValue = () => false;

    if (mode === "editor" && innerHeight * 0.3 >= 120) $container.append($themePreview);
    else $themePreview.remove();

    if (mode === "app") {
      themeList = constants.appThemeList;
      defaultValue = theme => appSettings.value.appTheme === theme;
    } else if (mode === "editor") {
      themeList = constants.editorThemeList;
      defaultValue = theme => appSettings.value.editorTheme === `ace/theme/${theme}`;
    } else if (mode === "md") {}

    let html = '';
    for (let theme in themeList) {
      html += mustache.render($_list_item, {
        name: theme.replace(/_/g, ' ').capitalize(),
        theme,
        mode,
        type: themeList[theme].type,
        default: defaultValue(theme)
      });
    }
    $page.get("#theme-list").innerHTML = html;
  }

  /**
   * 
   * @param {MouseEvent} e 
   */
  function clickHandler(e) {
    const $target = e.target;
    if (!($target instanceof HTMLElement)) return;
    const action = $target.getAttribute("action");
    if (!action) return;

    switch (action) {
      case "select":
        const $el = $page.get(".options>.active");
        if ($el) $el.classList.remove("active");
        $target.classList.add("active");
        render($target.getAttribute("value"));
        break;

      case "select-theme":
        const mode = $target.getAttribute("mode");
        let theme = $target.getAttribute("name");
        if (mode === "app") onSelectAppTheme(theme);
        else if (mode === "editor") onSelectEditorTheme(theme);
        else if (mode === "md") {}
        break;

      case "search":
        searchBar($page.get("#theme-list"));
        break;

      default:
        break;
    }
  }

  function onSelectEditorTheme(res) {
    updateTheme("editor", res);
  }

  function onSelectAppTheme(res) {
    const theme = constants.appThemeList[res];
    if (!theme) return;

    const link = 'https://play.google.com/store/apps/details?id=com.foxdebug.acode';
    if (!theme.isFree && IS_FREE_VERSION) {
      dialogs.box(
          strings.info.toUpperCase(),
          "Hi dear user, dark modes are available in paid version of the app. " +
          "<strong>DO NOT PANIC!</strong> The project is open source, you can build your own apk with all " +
          "the features you need. Please support this project by " +
          "buying the paid version."
        )
        .onhide(() => {
          window.open(link, '_system');
        });
      return;
    }

    updateTheme("app", theme.name);
  }

  function updateTheme(type, theme) {
    const setting = {};
    let oldTheme;
    if (type === "app") {

      setting.appTheme = theme;
      oldTheme = appSettings.value.appTheme;

    } else if (type === "editor") {

      const themeId = "ace/theme/" + theme;
      editorManager.editor.setTheme(themeId);
      editor.setTheme(themeId);
      setting.editorTheme = themeId;
      oldTheme = appSettings.value.editorTheme.split("/").pop();

    } else return;

    const $checkIcon = tag.get(`#theme-list>[name="${oldTheme}"]>.icon.check`);
    if ($checkIcon) $checkIcon.remove();

    appSettings.update(setting);
    if (type === "app") window.restoreTheme();

    tag.get(`#theme-list>[name="${theme}"]`).innerHTML += '<span class="icon check"></span>';
  }
}