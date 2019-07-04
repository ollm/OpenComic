var templatesCache = {}, templatesCacheTheme = {};templatesCache['body.html'] = hb.template({"1":function(container,depth0,helpers,partials,data) {
    return " night-mode";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression;

  return "<div class=\"preload\">\n	Roboto\n	<i class=\"material-icon\">add</i>\n	<i class=\"material-icon-extras\">page_variant</i>\n</div>\n<div class=\"app"
    + ((stack1 = helpers["if"].call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? depth0.config : depth0)) != null ? stack1.nightMode : stack1),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\">\n	<div class=\"bar-header\">\n\n	</div>\n	<div class=\"global-elements\">\n		<div class=\"hover\">\n			<div></div>\n		</div>\n		<div class=\"menus\">\n\n		</div>\n		<div class=\"material-icon floating-action-button floating-action-button-min hover-text\" style=\"bottom: 128px;\" onclick=\"dom.addComicButtons(false); addComic(false);\" hover-text=\""
    + alias2(alias1(((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.global : stack1)) != null ? stack1.addFile : stack1), depth0))
    + "\">\n			<div class=\"material-icon \">note_add</div>\n		</div>\n		<div class=\"floating-action-button floating-action-button-min hover-text\" style=\"bottom: 76px;\" onclick=\"dom.addComicButtons(false); addComic(true);\" hover-text=\""
    + alias2(alias1(((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.global : stack1)) != null ? stack1.addFolder : stack1), depth0))
    + "\">\n			<div class=\"material-icon \">create_new_folder</div>\n		</div>\n		<div class=\"floating-action-button floating-action-button-add hover-text\" hover-text=\""
    + alias2(alias1(((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.global : stack1)) != null ? stack1.add : stack1), depth0))
    + "\">\n			<div class=\"material-icon\">add</div>\n		</div>\n	</div>\n	<div class=\"content-left\">\n\n	</div>\n	<div class=\"content-right\">\n\n	</div>\n	<div class=\"footer\">\n	</div>\n</div>";
},"useData":true});

templatesCache['index.content.left.html'] = hb.template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression;

  return "<div class=\"menu-list\" onclick=\"dom.loadIndexPage(true);\">\n	<div class=\"icon-24 material-icon\">book</div>\n	"
    + alias2(alias1(((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.global : stack1)) != null ? stack1.comics : stack1), depth0))
    + "\n</div>\n\n<div class=\"separator-1\"></div>\n\n<div class=\"menu-list\" onclick=\"dom.loadLanguagesPage();\">\n	<div class=\"icon-24 material-icon\">language</div>\n	"
    + alias2(alias1(((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.global : stack1)) != null ? stack1.language : stack1), depth0))
    + "\n</div>\n<!--<div class=\"menu-list\">\n	<div class=\"icon-24 icon-theme\"></div>\n	"
    + alias2(alias1(((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.global : stack1)) != null ? stack1.theme : stack1), depth0))
    + "\n</div>-->";
},"useData":true});

templatesCache['index.content.right.list.html'] = hb.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3=container.escapeExpression, alias4=container.lambda;

  return "<div class=\"continue-reading\" onclick=\"dom.openComic(true, '"
    + alias3((helpers.chain || (depth0 && depth0.chain) || alias2).call(alias1,"escapeBackSlash","escapeQuotesSimples",((stack1 = (depth0 != null ? depth0.comicsReadingProgress : depth0)) != null ? stack1.path : stack1),{"name":"chain","hash":{},"data":data}))
    + "', '"
    + alias3((helpers.chain || (depth0 && depth0.chain) || alias2).call(alias1,"escapeBackSlash","escapeQuotesSimples",((stack1 = (depth0 != null ? depth0.comicsReadingProgress : depth0)) != null ? stack1.mainPath : stack1),{"name":"chain","hash":{},"data":data}))
    + "');\">\n	<div>\n		<div class=\"continue-reading-sha-"
    + alias3(alias4(((stack1 = (depth0 != null ? depth0.comicsReadingProgress : depth0)) != null ? stack1.sha : stack1), depth0))
    + "\" style=\"background-image: url("
    + alias3((helpers.chain || (depth0 && depth0.chain) || alias2).call(alias1,"escapeBackSlash","escapeQuotesSimples",((stack1 = (depth0 != null ? depth0.comicsReadingProgress : depth0)) != null ? stack1.thumbnail : stack1),{"name":"chain","hash":{},"data":data}))
    + ");\"></div>\n		<span>"
    + alias3(alias4(((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.comics : stack1)) != null ? stack1.continueReading : stack1), depth0))
    + ": "
    + alias3(alias4(((stack1 = (depth0 != null ? depth0.comicsReadingProgress : depth0)) != null ? stack1.pathText : stack1), depth0))
    + "</span>\n	</div>\n</div>\n";
},"3":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "	<div id=\"v-id"
    + alias4(((helper = (helper = helpers.index || (depth0 != null ? depth0.index : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"index","hash":{},"data":data}) : helper)))
    + "\" class=\"simple-list"
    + ((stack1 = helpers.unless.call(alias1,(depth0 != null ? depth0.folder : depth0),{"name":"unless","hash":{},"fn":container.program(4, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\" onclick=\""
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.folder : depth0),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.program(8, data, 0),"data":data})) != null ? stack1 : "")
    + "\">\n		<div class=\""
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.folder : depth0),{"name":"if","hash":{},"fn":container.program(10, data, 0),"inverse":container.program(12, data, 0),"data":data})) != null ? stack1 : "")
    + " item-image\""
    + ((stack1 = helpers.unless.call(alias1,(depth0 != null ? depth0.folder : depth0),{"name":"unless","hash":{},"fn":container.program(14, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + ">"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.folder : depth0),{"name":"if","hash":{},"fn":container.program(16, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "</div>\n		<div class=\"simple-list-text\">"
    + alias4(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"name","hash":{},"data":data}) : helper)))
    + "</div>\n	</div>\n";
},"4":function(container,depth0,helpers,partials,data) {
    var helper;

  return " sha-"
    + container.escapeExpression(((helper = (helper = helpers.sha || (depth0 != null ? depth0.sha : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"sha","hash":{},"data":data}) : helper)));
},"6":function(container,depth0,helpers,partials,data) {
    var alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3=container.escapeExpression;

  return "dom.loadIndexPage(true, '"
    + alias3((helpers.chain || (depth0 && depth0.chain) || alias2).call(alias1,"escapeBackSlash","escapeQuotesSimples",(depth0 != null ? depth0.path : depth0),{"name":"chain","hash":{},"data":data}))
    + "', false, false, '"
    + alias3((helpers.chain || (depth0 && depth0.chain) || alias2).call(alias1,"escapeBackSlash","escapeQuotesSimples",(depth0 != null ? depth0.mainPath : depth0),{"name":"chain","hash":{},"data":data}))
    + "')";
},"8":function(container,depth0,helpers,partials,data) {
    var alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3=container.escapeExpression;

  return "dom.openComic(true, '"
    + alias3((helpers.escapeBackSlash || (depth0 && depth0.escapeBackSlash) || alias2).call(alias1,(depth0 != null ? depth0.path : depth0),{"name":"escapeBackSlash","hash":{},"data":data}))
    + "', '"
    + alias3((helpers.chain || (depth0 && depth0.chain) || alias2).call(alias1,"escapeBackSlash","escapeQuotesSimples",(depth0 != null ? depth0.mainPath : depth0),{"name":"chain","hash":{},"data":data}))
    + "');";
},"10":function(container,depth0,helpers,partials,data) {
    return "icon-24 material-icon";
},"12":function(container,depth0,helpers,partials,data) {
    return "simple-list-image";
},"14":function(container,depth0,helpers,partials,data) {
    return " style=\"background-image: url("
    + container.escapeExpression((helpers.chain || (depth0 && depth0.chain) || helpers.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),"escapeBackSlash","escapeQuotesSimples",(depth0 != null ? depth0.thumbnail : depth0),{"name":"chain","hash":{},"data":data}))
    + ");\"";
},"16":function(container,depth0,helpers,partials,data) {
    return "folder";
},"18":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "	<div class=\"content-empty\">"
    + ((stack1 = helpers["if"].call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? depth0.comicsIndex : depth0),{"name":"if","hash":{},"fn":container.program(19, data, 0),"inverse":container.program(21, data, 0),"data":data})) != null ? stack1 : "")
    + "</div>\n";
},"19":function(container,depth0,helpers,partials,data) {
    var stack1;

  return container.escapeExpression(container.lambda(((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.comics : stack1)) != null ? stack1.emptyIndex : stack1), depth0));
},"21":function(container,depth0,helpers,partials,data) {
    var stack1;

  return container.escapeExpression(container.lambda(((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.comics : stack1)) != null ? stack1.emptyFolder : stack1), depth0));
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {});

  return ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.comicsReadingProgress : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "<div class=\"content-view-list\">\n"
    + ((stack1 = helpers.each.call(alias1,(depth0 != null ? depth0.comics : depth0),{"name":"each","hash":{},"fn":container.program(3, data, 0),"inverse":container.program(18, data, 0),"data":data})) != null ? stack1 : "")
    + "	<br>\n</div>";
},"useData":true});

templatesCache['index.content.right.module.html'] = hb.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3=container.escapeExpression, alias4=container.lambda;

  return "<div class=\"continue-reading\" onclick=\"dom.openComic(true, '"
    + alias3((helpers.chain || (depth0 && depth0.chain) || alias2).call(alias1,"escapeBackSlash","escapeQuotesSimples",((stack1 = (depth0 != null ? depth0.comicsReadingProgress : depth0)) != null ? stack1.path : stack1),{"name":"chain","hash":{},"data":data}))
    + "', '"
    + alias3((helpers.chain || (depth0 && depth0.chain) || alias2).call(alias1,"escapeBackSlash","escapeQuotesSimples",((stack1 = (depth0 != null ? depth0.comicsReadingProgress : depth0)) != null ? stack1.mainPath : stack1),{"name":"chain","hash":{},"data":data}))
    + "');\">\n	<div>\n		<div class=\"continue-reading-sha-"
    + alias3(alias4(((stack1 = (depth0 != null ? depth0.comicsReadingProgress : depth0)) != null ? stack1.sha : stack1), depth0))
    + "\" style=\"background-image: url("
    + alias3((helpers.chain || (depth0 && depth0.chain) || alias2).call(alias1,"escapeBackSlash","escapeQuotesSimples",((stack1 = (depth0 != null ? depth0.comicsReadingProgress : depth0)) != null ? stack1.thumbnail : stack1),{"name":"chain","hash":{},"data":data}))
    + ");\"></div>\n		<span>"
    + alias3(alias4(((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.comics : stack1)) != null ? stack1.continueReading : stack1), depth0))
    + ": "
    + alias3(alias4(((stack1 = (depth0 != null ? depth0.comicsReadingProgress : depth0)) != null ? stack1.pathText : stack1), depth0))
    + "</span>\n	</div>\n</div>\n";
},"3":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "	<div id=\"v-id"
    + alias4(((helper = (helper = helpers.index || (depth0 != null ? depth0.index : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"index","hash":{},"data":data}) : helper)))
    + "\""
    + ((stack1 = helpers.unless.call(alias1,(depth0 != null ? depth0.folder : depth0),{"name":"unless","hash":{},"fn":container.program(4, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + " onclick=\""
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.folder : depth0),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.program(8, data, 0),"data":data})) != null ? stack1 : "")
    + "\""
    + ((stack1 = helpers["if"].call(alias1,((stack1 = (data && data.root)) && stack1.comicsIndex),{"name":"if","hash":{},"fn":container.program(10, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + ">\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.folder : depth0),{"name":"if","hash":{},"fn":container.program(12, data, 0),"inverse":container.program(15, data, 0),"data":data})) != null ? stack1 : "")
    + "		<div class=\"v-text\">"
    + alias4(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"name","hash":{},"data":data}) : helper)))
    + "</div>\n	</div>\n";
},"4":function(container,depth0,helpers,partials,data) {
    var helper;

  return " class=\"sha-"
    + container.escapeExpression(((helper = (helper = helpers.sha || (depth0 != null ? depth0.sha : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"sha","hash":{},"data":data}) : helper)))
    + "\"";
},"6":function(container,depth0,helpers,partials,data) {
    var alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3=container.escapeExpression;

  return "dom.loadIndexPage(true, '"
    + alias3((helpers.chain || (depth0 && depth0.chain) || alias2).call(alias1,"escapeBackSlash","escapeQuotesSimples",(depth0 != null ? depth0.path : depth0),{"name":"chain","hash":{},"data":data}))
    + "', false, false, '"
    + alias3((helpers.chain || (depth0 && depth0.chain) || alias2).call(alias1,"escapeBackSlash","escapeQuotesSimples",(depth0 != null ? depth0.mainPath : depth0),{"name":"chain","hash":{},"data":data}))
    + "')";
},"8":function(container,depth0,helpers,partials,data) {
    var alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3=container.escapeExpression;

  return "dom.openComic(true, '"
    + alias3((helpers.chain || (depth0 && depth0.chain) || alias2).call(alias1,"escapeBackSlash","escapeQuotesSimples",(depth0 != null ? depth0.path : depth0),{"name":"chain","hash":{},"data":data}))
    + "', '"
    + alias3((helpers.chain || (depth0 && depth0.chain) || alias2).call(alias1,"escapeBackSlash","escapeQuotesSimples",(depth0 != null ? depth0.mainPath : depth0),{"name":"chain","hash":{},"data":data}))
    + "');";
},"10":function(container,depth0,helpers,partials,data) {
    return " oncontextmenu=\"dom.comicContextMenu('"
    + container.escapeExpression((helpers.chain || (depth0 && depth0.chain) || helpers.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),"escapeBackSlash","escapeQuotesSimples",(depth0 != null ? depth0.mainPath : depth0),{"name":"chain","hash":{},"data":data}))
    + "')\"";
},"12":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "		<div class=\"v-folder item-image\">\n"
    + ((stack1 = helpers.each.call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? depth0.images : depth0),{"name":"each","hash":{},"fn":container.program(13, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "		</div>\n";
},"13":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3=container.escapeExpression;

  return "			<div class=\"fi-sha-"
    + alias3(((helper = (helper = helpers.sha || (depth0 != null ? depth0.sha : depth0)) != null ? helper : alias2),(typeof helper === "function" ? helper.call(alias1,{"name":"sha","hash":{},"data":data}) : helper)))
    + " folder-images\">\n				<img src=\""
    + alias3((helpers.chain || (depth0 && depth0.chain) || alias2).call(alias1,"escapeBackSlash","escapeQuotesSimples",(depth0 != null ? depth0.path : depth0),{"name":"chain","hash":{},"data":data}))
    + "\">\n			</div>\n";
},"15":function(container,depth0,helpers,partials,data) {
    return "		<div class=\"v-img\">\n			<img class=\"item-image\" src=\""
    + container.escapeExpression((helpers.chain || (depth0 && depth0.chain) || helpers.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),"escapeBackSlash","escapeQuotesSimples",(depth0 != null ? depth0.thumbnail : depth0),{"name":"chain","hash":{},"data":data}))
    + "\">\n		</div>\n";
},"17":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "	<div class=\"content-empty\">"
    + ((stack1 = helpers["if"].call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? depth0.comicsIndex : depth0),{"name":"if","hash":{},"fn":container.program(18, data, 0),"inverse":container.program(20, data, 0),"data":data})) != null ? stack1 : "")
    + "</div>\n";
},"18":function(container,depth0,helpers,partials,data) {
    var stack1;

  return container.escapeExpression(container.lambda(((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.comics : stack1)) != null ? stack1.emptyIndex : stack1), depth0));
},"20":function(container,depth0,helpers,partials,data) {
    var stack1;

  return container.escapeExpression(container.lambda(((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.comics : stack1)) != null ? stack1.emptyFolder : stack1), depth0));
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {});

  return ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.comicsReadingProgress : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "<div class=\"content-view-module\">\n"
    + ((stack1 = helpers.each.call(alias1,(depth0 != null ? depth0.comics : depth0),{"name":"each","hash":{},"fn":container.program(3, data, 0),"inverse":container.program(17, data, 0),"data":data})) != null ? stack1 : "")
    + "</div>";
},"useData":true});

templatesCache['index.elements.menus.html'] = hb.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression, alias5=container.lambda;

  return "		<div class=\"menu-simple-element sort-last-add\" onclick=\"dom.changeSort(1, 'last-add', "
    + alias4(((helper = (helper = helpers.comicsIndexVar || (depth0 != null ? depth0.comicsIndexVar : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"comicsIndexVar","hash":{},"data":data}) : helper)))
    + ")\">"
    + alias4(alias5(((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.global : stack1)) != null ? stack1.sort : stack1)) != null ? stack1.lastAdd : stack1), depth0))
    + "</div>\n		<div class=\"menu-simple-element sort-last-reading\" onclick=\"dom.changeSort(1, 'last-reading', "
    + alias4(((helper = (helper = helpers.comicsIndexVar || (depth0 != null ? depth0.comicsIndexVar : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"comicsIndexVar","hash":{},"data":data}) : helper)))
    + ")\">"
    + alias4(alias5(((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.global : stack1)) != null ? stack1.sort : stack1)) != null ? stack1.lastReading : stack1), depth0))
    + "</div>\n";
},"3":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "		<div class=\"menu-simple-text\">\n			"
    + container.escapeExpression(container.lambda(((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.global : stack1)) != null ? stack1.sort : stack1)) != null ? stack1.foldersFirst : stack1), depth0))
    + "\n			<div class=\"switch"
    + ((stack1 = helpers["if"].call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? depth0.config : depth0)) != null ? stack1.foldersFirst : stack1),{"name":"if","hash":{},"fn":container.program(4, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\" on=\"dom.changeSort(3, true, false)\" off=\"dom.changeSort(3, false, false)\"></div>\n		</div>\n";
},"4":function(container,depth0,helpers,partials,data) {
    return " a";
},"6":function(container,depth0,helpers,partials,data) {
    var stack1;

  return ((stack1 = helpers["if"].call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? depth0.config : depth0)) != null ? stack1.sortInvertIndex : stack1),{"name":"if","hash":{},"fn":container.program(4, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "");
},"8":function(container,depth0,helpers,partials,data) {
    var stack1;

  return ((stack1 = helpers["if"].call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? depth0.config : depth0)) != null ? stack1.sortInvert : stack1),{"name":"if","hash":{},"fn":container.program(4, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "");
},"10":function(container,depth0,helpers,partials,data) {
    var stack1;

  return container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? depth0.config : depth0)) != null ? stack1.sortIndex : stack1), depth0));
},"12":function(container,depth0,helpers,partials,data) {
    var stack1;

  return container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? depth0.config : depth0)) != null ? stack1.sort : stack1), depth0));
},"14":function(container,depth0,helpers,partials,data) {
    var stack1;

  return container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? depth0.config : depth0)) != null ? stack1.viewIndex : stack1), depth0));
},"16":function(container,depth0,helpers,partials,data) {
    var stack1;

  return container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? depth0.config : depth0)) != null ? stack1.view : stack1), depth0));
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression, alias5=container.lambda;

  return "<div class=\"menu\" id=\"index-sort\">\n	<div class=\"menu-simple elevation8\" style=\"width: 256px;\">\n		<div class=\"menu-simple-element sort-name\" onclick=\"dom.changeSort(1, 'name', "
    + alias4(((helper = (helper = helpers.comicsIndexVar || (depth0 != null ? depth0.comicsIndexVar : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"comicsIndexVar","hash":{},"data":data}) : helper)))
    + ")\">"
    + alias4(alias5(((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.global : stack1)) != null ? stack1.sort : stack1)) != null ? stack1.name : stack1), depth0))
    + "</div>\n		<div class=\"menu-simple-element sort-numeric\" onclick=\"dom.changeSort(1, 'numeric', "
    + alias4(((helper = (helper = helpers.comicsIndexVar || (depth0 != null ? depth0.comicsIndexVar : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"comicsIndexVar","hash":{},"data":data}) : helper)))
    + ")\">"
    + alias4(alias5(((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.global : stack1)) != null ? stack1.sort : stack1)) != null ? stack1.number : stack1), depth0))
    + "</div>\n		<div class=\"menu-simple-element sort-name-numeric\" onclick=\"dom.changeSort(1, 'name-numeric', "
    + alias4(((helper = (helper = helpers.comicsIndexVar || (depth0 != null ? depth0.comicsIndexVar : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"comicsIndexVar","hash":{},"data":data}) : helper)))
    + ")\">"
    + alias4(alias5(((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.global : stack1)) != null ? stack1.sort : stack1)) != null ? stack1.nameNumber : stack1), depth0))
    + "</div>\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.comicsIndex : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"data":data})) != null ? stack1 : "")
    + "		<div class=\"menu-simple-text\">\n			"
    + alias4(alias5(((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.global : stack1)) != null ? stack1.sort : stack1)) != null ? stack1.invert : stack1), depth0))
    + "\n			<div class=\"switch"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.comicsIndex : depth0),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.program(8, data, 0),"data":data})) != null ? stack1 : "")
    + "\" on=\"dom.changeSort(2, true, "
    + alias4(((helper = (helper = helpers.comicsIndexVar || (depth0 != null ? depth0.comicsIndexVar : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"comicsIndexVar","hash":{},"data":data}) : helper)))
    + ")\" off=\"dom.changeSort(2, false, "
    + alias4(((helper = (helper = helpers.comicsIndexVar || (depth0 != null ? depth0.comicsIndexVar : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"comicsIndexVar","hash":{},"data":data}) : helper)))
    + ")\"></div>\n		</div>\n	</div>\n	<div class=\"menu-close\" onclick=\"events.desactiveMenu('#index-sort', '.bar-right-buttons .button-sort');\"></div>\n</div>\n\n<div class=\"menu\" id=\"index-view\">\n	<div class=\"menu-simple elevation8\" style=\"width: 164px;\" onclick=\"events.desactiveMenu('#index-view', '.bar-right-buttons .button-view');\">\n		<div class=\"menu-simple-element view-module\" onclick=\"dom.changeView('module', "
    + alias4(((helper = (helper = helpers.comicsIndexVar || (depth0 != null ? depth0.comicsIndexVar : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"comicsIndexVar","hash":{},"data":data}) : helper)))
    + ");\">"
    + alias4(alias5(((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.global : stack1)) != null ? stack1.view : stack1)) != null ? stack1.module : stack1), depth0))
    + "</div>\n		<div class=\"menu-simple-element view-list\" onclick=\"dom.changeView('list', "
    + alias4(((helper = (helper = helpers.comicsIndexVar || (depth0 != null ? depth0.comicsIndexVar : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"comicsIndexVar","hash":{},"data":data}) : helper)))
    + ");\">"
    + alias4(alias5(((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.global : stack1)) != null ? stack1.view : stack1)) != null ? stack1.list : stack1), depth0))
    + "</div>\n	</div>\n	<div class=\"menu-close\" onclick=\"events.desactiveMenu('#index-view', '.bar-right-buttons .button-view');\"></div>\n</div>\n\n<div class=\"menu\" id=\"index-context-menu\">\n	<div class=\"menu-simple elevation8\" style=\"width: 164px;\" onclick=\"events.desactiveMenu('#index-context-menu');\">\n		<div class=\"menu-simple-element context-menu-remove\">\n			<i class=\"menu-simple-element-image material-icon\">delete</i>\n			"
    + alias4(alias5(((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.global : stack1)) != null ? stack1.contextMenu : stack1)) != null ? stack1.remove : stack1), depth0))
    + "\n		</div>\n	</div>\n	<div class=\"menu-close\" onclick=\"events.desactiveMenu('#index-context-menu');\" oncontextmenu=\"events.desactiveMenu('#index-context-menu');\"></div>\n</div>\n\n<script type=\"text/javascript\">\n	dom.selectElement('.sort-"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.comicsIndex : depth0),{"name":"if","hash":{},"fn":container.program(10, data, 0),"inverse":container.program(12, data, 0),"data":data})) != null ? stack1 : "")
    + "');\n	dom.selectElement('.view-"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.comicsIndex : depth0),{"name":"if","hash":{},"fn":container.program(14, data, 0),"inverse":container.program(16, data, 0),"data":data})) != null ? stack1 : "")
    + "');	\n</script>";
},"useData":true});

templatesCache['index.header.html'] = hb.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1;

  return ((stack1 = helpers.each.call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? depth0.headerTitlePath : depth0),{"name":"each","hash":{},"fn":container.program(2, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "");
},"2":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3=container.escapeExpression;

  return "			<span class=\"bar-title-a\" onclick=\"dom.loadIndexPage(true, '"
    + alias3((helpers.chain || (depth0 && depth0.chain) || alias2).call(alias1,"escapeBackSlash","escapeQuotesSimples",(depth0 != null ? depth0.path : depth0),{"name":"chain","hash":{},"data":data}))
    + "', false, false, '"
    + alias3((helpers.chain || (depth0 && depth0.chain) || alias2).call(alias1,"escapeBackSlash","escapeQuotesSimples",(depth0 != null ? depth0.mainPath : depth0),{"name":"chain","hash":{},"data":data}))
    + "')\">"
    + alias3(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias2),(typeof helper === "function" ? helper.call(alias1,{"name":"name","hash":{},"data":data}) : helper)))
    + "</span>\n			"
    + ((stack1 = helpers.unless.call(alias1,(depth0 != null ? depth0.last : depth0),{"name":"unless","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n";
},"3":function(container,depth0,helpers,partials,data) {
    return " / ";
},"5":function(container,depth0,helpers,partials,data) {
    var stack1;

  return ((stack1 = helpers["if"].call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? depth0.headerTitle : depth0),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.program(8, data, 0),"data":data})) != null ? stack1 : "");
},"6":function(container,depth0,helpers,partials,data) {
    var helper;

  return "			"
    + container.escapeExpression(((helper = (helper = helpers.headerTitle || (depth0 != null ? depth0.headerTitle : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"headerTitle","hash":{},"data":data}) : helper)))
    + "\n";
},"8":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "			"
    + container.escapeExpression(container.lambda(((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.global : stack1)) != null ? stack1.comics : stack1), depth0))
    + "\n";
},"10":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing;

  return "				"
    + ((stack1 = (helpers.compare || (depth0 && depth0.compare) || alias2).call(alias1,((stack1 = (depth0 != null ? depth0.config : depth0)) != null ? stack1.viewIndex : stack1),"==","module",{"name":"compare","hash":{},"fn":container.program(11, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n				"
    + ((stack1 = (helpers.compare || (depth0 && depth0.compare) || alias2).call(alias1,((stack1 = (depth0 != null ? depth0.config : depth0)) != null ? stack1.viewIndex : stack1),"==","list",{"name":"compare","hash":{},"fn":container.program(13, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n";
},"11":function(container,depth0,helpers,partials,data) {
    return "view_module";
},"13":function(container,depth0,helpers,partials,data) {
    return "view_list";
},"15":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing;

  return "				"
    + ((stack1 = (helpers.compare || (depth0 && depth0.compare) || alias2).call(alias1,((stack1 = (depth0 != null ? depth0.config : depth0)) != null ? stack1.view : stack1),"==","module",{"name":"compare","hash":{},"fn":container.program(11, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n				"
    + ((stack1 = (helpers.compare || (depth0 && depth0.compare) || alias2).call(alias1,((stack1 = (depth0 != null ? depth0.config : depth0)) != null ? stack1.view : stack1),"==","list",{"name":"compare","hash":{},"fn":container.program(13, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.escapeExpression, alias3=container.lambda;

  return "<div class=\"bar-back material-icon button button2 hover-text "
    + alias2(((helper = (helper = helpers["bar-back"] || (depth0 != null ? depth0["bar-back"] : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"bar-back","hash":{},"data":data}) : helper)))
    + "\" hover-text=\""
    + alias2(alias3(((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.global : stack1)) != null ? stack1.back : stack1), depth0))
    + "\" onclick=\"dom.indexPathControlGoBack()\">arrow_back</div>\n<div class=\"bar-title\" style=\"max-width: calc(100% - (110px + 68px));\">\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.headerTitlePath : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(5, data, 0),"data":data})) != null ? stack1 : "")
    + "</div>\n<div class=\"bar-right-buttons\">\n	<div>\n		<div class=\"material-icon button button1 button-sort hover-text\" hover-text=\""
    + alias2(alias3(((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.global : stack1)) != null ? stack1.sort : stack1)) != null ? stack1.main : stack1), depth0))
    + "\" onclick=\"events.activeMenu('#index-sort', '.bar-right-buttons .button-sort', 'right');\">sort</div>\n		<div class=\"material-icon button button1 button-view hover-text\" hover-text=\""
    + alias2(alias3(((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.global : stack1)) != null ? stack1.view : stack1)) != null ? stack1.main : stack1), depth0))
    + "\" onclick=\"events.activeMenu('#index-view', '.bar-right-buttons .button-view', 'right');\">\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.comicsIndex : depth0),{"name":"if","hash":{},"fn":container.program(10, data, 0),"inverse":container.program(15, data, 0),"data":data})) != null ? stack1 : "")
    + "		</div>\n	</div>\n</div>";
},"useData":true});

templatesCache['index.html'] = hb.template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<!DOCTYPE html>\n<html>\n	<head>\n		<meta charset=\"UTF-8\">\n		<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no\" />\n		<title>OpenComic</title>\n		<script type=\"text/javascript\">if (typeof module === 'object') {window.module = module; module = undefined;}</script>\n		<!--<script src=\"./scripts/jquery-3.1.1.min.js\" type=\"text/javascript\"></script>-->\n		<script src=\"../scripts/opencomic.js\" type=\"text/javascript\"></script>\n		<script type=\"text/javascript\">if (window.module) module = window.module;</script>\n		<link href=\"../themes/material-design/theme.css\" rel=\"stylesheet\" type=\"text/css\"/>\n	</head>\n	<body>\n\n	</body>\n</html>";
},"useData":true});

templatesCache['languages.content.right.html'] = hb.template({"1":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<div class=\"simple-list\" onclick=\"dom.changeLanguage('"
    + alias4(((helper = (helper = helpers.code || (depth0 != null ? depth0.code : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"code","hash":{},"data":data}) : helper)))
    + "')\">\n	"
    + alias4(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"name","hash":{},"data":data}) : helper)))
    + " - "
    + alias4(((helper = (helper = helpers.nativeName || (depth0 != null ? depth0.nativeName : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"nativeName","hash":{},"data":data}) : helper)))
    + "\n</div>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1;

  return ((stack1 = helpers.each.call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? depth0.languagesList : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "<br>";
},"useData":true});

templatesCache['languages.header.html'] = hb.template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=container.escapeExpression;

  return "<div class=\"bar-back material-icon button button2 "
    + alias1(((helper = (helper = helpers["bar-back"] || (depth0 != null ? depth0["bar-back"] : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"bar-back","hash":{},"data":data}) : helper)))
    + "\">arrow_back</div>\n<div class=\"bar-title\" style=\"max-width: calc(100% - (68px));\">\n	"
    + alias1(container.lambda(((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.global : stack1)) != null ? stack1.language : stack1), depth0))
    + "\n</div>";
},"useData":true});

templatesCache['reading.content.left.html'] = hb.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<div class=\"reading-left r-l-i"
    + alias4(((helper = (helper = helpers.index || (depth0 != null ? depth0.index : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"index","hash":{},"data":data}) : helper)))
    + "\" onclick=\""
    + ((stack1 = helpers.unless.call(alias1,(depth0 != null ? depth0.folder : depth0),{"name":"unless","hash":{},"fn":container.program(2, data, 0),"inverse":container.program(4, data, 0),"data":data})) != null ? stack1 : "")
    + "\">\n	<div class=\"reading-number\">"
    + alias4(((helper = (helper = helpers.index || (depth0 != null ? depth0.index : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"index","hash":{},"data":data}) : helper)))
    + "</div>\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.folder : depth0),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.program(8, data, 0),"data":data})) != null ? stack1 : "")
    + "</div>\n";
},"2":function(container,depth0,helpers,partials,data) {
    var helper;

  return "reading.goToImage("
    + container.escapeExpression(((helper = (helper = helpers.index || (depth0 != null ? depth0.index : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"index","hash":{},"data":data}) : helper)))
    + ")";
},"4":function(container,depth0,helpers,partials,data) {
    var helper;

  return "reading.goToFolder("
    + container.escapeExpression(((helper = (helper = helpers.index || (depth0 != null ? depth0.index : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"index","hash":{},"data":data}) : helper)))
    + ")";
},"6":function(container,depth0,helpers,partials,data) {
    return "	<i class=\"material-icon\">folder</i>\n";
},"8":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3=container.escapeExpression;

  return "	<img class=\"reading-images ri-sha-"
    + alias3(((helper = (helper = helpers.sha || (depth0 != null ? depth0.sha : depth0)) != null ? helper : alias2),(typeof helper === "function" ? helper.call(alias1,{"name":"sha","hash":{},"data":data}) : helper)))
    + "\" src=\""
    + alias3((helpers.chain || (depth0 && depth0.chain) || alias2).call(alias1,"escapeBackSlash","escapeQuotesSimples",(depth0 != null ? depth0.thumbnail : depth0),{"name":"chain","hash":{},"data":data}))
    + "\">\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1;

  return ((stack1 = helpers.each.call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? depth0.comics : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "");
},"useData":true});

templatesCache['reading.content.right.html'] = hb.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1;

  return ((stack1 = helpers.unless.call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? depth0.folder : depth0),{"name":"unless","hash":{},"fn":container.program(2, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "");
},"2":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "				<div class=\"r-img r-img-i"
    + alias4(((helper = (helper = helpers.index || (depth0 != null ? depth0.index : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"index","hash":{},"data":data}) : helper)))
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.folder : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\">\n					<img src=\""
    + alias4((helpers.chain || (depth0 && depth0.chain) || alias2).call(alias1,"invertBackslash",(depth0 != null ? depth0.image : depth0),{"name":"chain","hash":{},"data":data}))
    + "\" path=\""
    + alias4((helpers.htmlQuote || (depth0 && depth0.htmlQuote) || alias2).call(alias1,(depth0 != null ? depth0.path : depth0),{"name":"htmlQuote","hash":{},"data":data}))
    + "\" index=\""
    + alias4(((helper = (helper = helpers.index || (depth0 != null ? depth0.index : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"index","hash":{},"data":data}) : helper)))
    + "\">\n				</div>\n";
},"3":function(container,depth0,helpers,partials,data) {
    return " folder";
},"5":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {});

  return "\n			<div class=\"r-img r-img-i"
    + container.escapeExpression(((helper = (helper = helpers.index || (depth0 != null ? depth0.index : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"index","hash":{},"data":data}) : helper)))
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.folder : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\">\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.folder : depth0),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.program(8, data, 0),"data":data})) != null ? stack1 : "")
    + "			</div>\n			";
},"6":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "				<div class=\"r-folder\" onclick=\"dom.openComic(true, '"
    + alias4(((helper = (helper = helpers.fristImage || (depth0 != null ? depth0.fristImage : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"fristImage","hash":{},"data":data}) : helper)))
    + "', '"
    + alias4(((helper = (helper = helpers.mainPath || (depth0 != null ? depth0.mainPath : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"mainPath","hash":{},"data":data}) : helper)))
    + "')\">\n					<div>\n						<div class=\"r-folder-img material-icon\">folder</div>	\n						<div class=\"r-folder-name\">"
    + alias4(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"name","hash":{},"data":data}) : helper)))
    + "</div>\n					</div>	\n				</div>\n";
},"8":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3=container.escapeExpression;

  return "				<img src=\""
    + alias3((helpers.chain || (depth0 && depth0.chain) || alias2).call(alias1,"invertBackslash",(depth0 != null ? depth0.image : depth0),{"name":"chain","hash":{},"data":data}))
    + "\" path=\""
    + alias3((helpers.htmlQuote || (depth0 && depth0.htmlQuote) || alias2).call(alias1,(depth0 != null ? depth0.path : depth0),{"name":"htmlQuote","hash":{},"data":data}))
    + "\" index=\""
    + alias3(((helper = (helper = helpers.index || (depth0 != null ? depth0.index : depth0)) != null ? helper : alias2),(typeof helper === "function" ? helper.call(alias1,{"name":"index","hash":{},"data":data}) : helper)))
    + "\">\n";
},"10":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {});

  return "\n			<div class=\"r-img r-img-i"
    + container.escapeExpression(((helper = (helper = helpers.index || (depth0 != null ? depth0.index : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"index","hash":{},"data":data}) : helper)))
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.folder : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\">\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.folder : depth0),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.program(11, data, 0),"data":data})) != null ? stack1 : "")
    + "			</div>\n			";
},"11":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3=container.escapeExpression;

  return "				<img src=\""
    + alias3((helpers.chain || (depth0 && depth0.chain) || alias2).call(alias1,"invertBackslash",(depth0 != null ? depth0.image : depth0),{"name":"chain","hash":{},"data":data}))
    + "\" index=\""
    + alias3(((helper = (helper = helpers.index || (depth0 != null ? depth0.index : depth0)) != null ? helper : alias2),(typeof helper === "function" ? helper.call(alias1,{"name":"index","hash":{},"data":data}) : helper)))
    + "\">\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {});

  return "<div style=\"position: relative; overflow: hidden;\">\n	<div class=\"reading-skip\">\n		<div class=\"reading-skip-top\">\n			<svg viewBox=\"0 0 66 66\" xmlns=\"http://www.w3.org/2000/svg\">\n				<circle cx=\"33\" cy=\"33\" r=\"30\"></circle>\n			</svg>\n		</div>\n		<div class=\"reading-skip-bottom\">\n			<svg viewBox=\"0 0 66 66\" xmlns=\"http://www.w3.org/2000/svg\">\n				<circle cx=\"33\" cy=\"33\" r=\"30\"></circle>\n			</svg>\n		</div>\n		<div class=\"reading-skip-left\">\n			<svg viewBox=\"0 0 66 66\" xmlns=\"http://www.w3.org/2000/svg\">\n				<circle cx=\"33\" cy=\"33\" r=\"30\"></circle>\n			</svg>\n		</div>\n		<div class=\"reading-skip-right\">\n			<svg viewBox=\"0 0 66 66\" xmlns=\"http://www.w3.org/2000/svg\">\n				<circle cx=\"33\" cy=\"33\" r=\"30\"></circle>\n			</svg>\n		</div>\n	</div>\n	<div class=\"reading-body\" style=\"display: none;\">\n		<div>\n"
    + ((stack1 = helpers.each.call(alias1,(depth0 != null ? depth0.comics : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "			<!--"
    + ((stack1 = helpers.each.call(alias1,(depth0 != null ? depth0.comics : depth0),{"name":"each","hash":{},"fn":container.program(5, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "-->\n		</div>\n	</div>\n</div>\n<div class=\"reading-lens\">\n	<div>\n		<div>\n			<!--"
    + ((stack1 = helpers.each.call(alias1,(depth0 != null ? depth0.comics : depth0),{"name":"each","hash":{},"fn":container.program(10, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "-->\n		</div>\n	</div>\n</div>";
},"useData":true});

templatesCache['reading.content.right.images.html'] = hb.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {});

  return "<div class=\"r-flex image-position"
    + container.escapeExpression(((helper = (helper = helpers.key1 || (depth0 != null ? depth0.key1 : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"key1","hash":{},"data":data}) : helper)))
    + "\">\n"
    + ((stack1 = helpers.each.call(alias1,(depth0 != null ? depth0.distribution : depth0),{"name":"each","hash":{},"fn":container.program(2, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "</div>\n";
},"2":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "		<div class=\"r-img r-img-i"
    + alias4(((helper = (helper = helpers.index || (depth0 != null ? depth0.index : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"index","hash":{},"data":data}) : helper)))
    + " image-position"
    + alias4(((helper = (helper = helpers.key1 || (depth0 != null ? depth0.key1 : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"key1","hash":{},"data":data}) : helper)))
    + "-"
    + alias4(((helper = (helper = helpers.key2 || (depth0 != null ? depth0.key2 : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"key2","hash":{},"data":data}) : helper)))
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.folder : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.blank : depth0),{"name":"if","hash":{},"fn":container.program(5, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\">\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.folder : depth0),{"name":"if","hash":{},"fn":container.program(7, data, 0),"inverse":container.program(9, data, 0),"data":data})) != null ? stack1 : "")
    + "		</div>\n";
},"3":function(container,depth0,helpers,partials,data) {
    return " folder";
},"5":function(container,depth0,helpers,partials,data) {
    return " blank";
},"7":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "			<div class=\"r-folder\" onclick=\"dom.openComic(true, '"
    + alias4(((helper = (helper = helpers.fristImage || (depth0 != null ? depth0.fristImage : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"fristImage","hash":{},"data":data}) : helper)))
    + "', '"
    + alias4(((helper = (helper = helpers.mainPath || (depth0 != null ? depth0.mainPath : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"mainPath","hash":{},"data":data}) : helper)))
    + "')\">\n				<div>\n					<div class=\"r-folder-img material-icon\">folder</div>	\n					<div class=\"r-folder-name\">"
    + alias4(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"name","hash":{},"data":data}) : helper)))
    + "</div>\n				</div>	\n			</div>\n";
},"9":function(container,depth0,helpers,partials,data) {
    var stack1;

  return ((stack1 = helpers["if"].call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? depth0.blank : depth0),{"name":"if","hash":{},"fn":container.program(10, data, 0),"inverse":container.program(12, data, 0),"data":data})) != null ? stack1 : "");
},"10":function(container,depth0,helpers,partials,data) {
    return "			<div></div>\n";
},"12":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3=container.escapeExpression;

  return "			<img src=\""
    + alias3((helpers.chain || (depth0 && depth0.chain) || alias2).call(alias1,"invertBackslash",(depth0 != null ? depth0.image : depth0),{"name":"chain","hash":{},"data":data}))
    + "\" path=\""
    + alias3((helpers.htmlQuote || (depth0 && depth0.htmlQuote) || alias2).call(alias1,(depth0 != null ? depth0.path : depth0),{"name":"htmlQuote","hash":{},"data":data}))
    + "\" index=\""
    + alias3(((helper = (helper = helpers.index || (depth0 != null ? depth0.index : depth0)) != null ? helper : alias2),(typeof helper === "function" ? helper.call(alias1,{"name":"index","hash":{},"data":data}) : helper)))
    + "\">\n			";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1;

  return ((stack1 = helpers.each.call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? depth0.folderImages : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "");
},"useData":true});

templatesCache['reading.elements.menus.collections.bookmarks.html'] = hb.template({"1":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {});

  return "	<div class=\"reading-bookmark menu-simple-element\">\n		<span>"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.continueReading : depth0),{"name":"if","hash":{},"fn":container.program(2, data, 0, blockParams, depths),"inverse":container.program(4, data, 0, blockParams, depths),"data":data})) != null ? stack1 : "")
    + container.escapeExpression(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"name","hash":{},"data":data}) : helper)))
    + "</span>\n	</div>\n"
    + ((stack1 = helpers.each.call(alias1,(depth0 != null ? depth0.bookmarks : depth0),{"name":"each","hash":{},"fn":container.program(7, data, 0, blockParams, depths),"inverse":container.noop,"data":data})) != null ? stack1 : "");
},"2":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1;

  return container.escapeExpression(container.lambda(((stack1 = ((stack1 = (depths[1] != null ? depths[1].language : depths[1])) != null ? stack1.comics : stack1)) != null ? stack1.continueReading : stack1), depth0))
    + ": ";
},"4":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1;

  return ((stack1 = helpers["if"].call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? depth0.current : depth0),{"name":"if","hash":{},"fn":container.program(5, data, 0, blockParams, depths),"inverse":container.noop,"data":data})) != null ? stack1 : "");
},"5":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1;

  return container.escapeExpression(container.lambda(((stack1 = ((stack1 = (depths[1] != null ? depths[1].language : depths[1])) != null ? stack1.reading : stack1)) != null ? stack1.currentReading : stack1), depth0))
    + ": ";
},"7":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "		<div class=\"reading-bookmark menu-simple-element\" onclick=\""
    + ((stack1 = helpers["if"].call(alias1,(depths[1] != null ? depths[1].current : depths[1]),{"name":"if","hash":{},"fn":container.program(8, data, 0, blockParams, depths),"inverse":container.program(10, data, 0, blockParams, depths),"data":data})) != null ? stack1 : "")
    + " events.desactiveMenu('#collections-bookmark', '.bar-right-buttons .button-collections-bookmark');\">\n			<div class=\"menu-simple-element-image menu-simple-element-image-"
    + alias4(((helper = (helper = helpers.sha || (depth0 != null ? depth0.sha : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"sha","hash":{},"data":data}) : helper)))
    + "\" style=\"background-image: url("
    + alias4(((helper = (helper = helpers.thumbnail || (depth0 != null ? depth0.thumbnail : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"thumbnail","hash":{},"data":data}) : helper)))
    + ")\"></div>\n			<span>"
    + alias4(((helper = (helper = helpers.index || (depth0 != null ? depth0.index : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"index","hash":{},"data":data}) : helper)))
    + "</span>\n			"
    + alias4(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"name","hash":{},"data":data}) : helper)))
    + "\n		</div>\n";
},"8":function(container,depth0,helpers,partials,data) {
    var helper;

  return "reading.goToImage("
    + container.escapeExpression(((helper = (helper = helpers.index || (depth0 != null ? depth0.index : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"index","hash":{},"data":data}) : helper)))
    + ", true);";
},"10":function(container,depth0,helpers,partials,data) {
    var alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3=container.escapeExpression;

  return "dom.openComic(true, '"
    + alias3((helpers.chain || (depth0 && depth0.chain) || alias2).call(alias1,"escapeBackSlash","escapeQuotesSimples",(depth0 != null ? depth0.path : depth0),{"name":"chain","hash":{},"data":data}))
    + "', '"
    + alias3((helpers.chain || (depth0 && depth0.chain) || alias2).call(alias1,"escapeBackSlash","escapeQuotesSimples",(depth0 != null ? depth0.mainPath : depth0),{"name":"chain","hash":{},"data":data}))
    + "');";
},"12":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "	<div class=\"menu-simple-text\">"
    + container.escapeExpression(container.lambda(((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.reading : stack1)) != null ? stack1.emptyBookmarks : stack1), depth0))
    + "</div>\n";
},"14":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "\n	<div class=\"reading-bookmark menu-simple-element\" onclick=\"reading.goToImage("
    + alias4(((helper = (helper = helpers.index || (depth0 != null ? depth0.index : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"index","hash":{},"data":data}) : helper)))
    + "); events.desactiveMenu('#collections-bookmark', '.bar-right-buttons .button-collections-bookmark');\">\n		<span>"
    + alias4(((helper = (helper = helpers.index || (depth0 != null ? depth0.index : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"index","hash":{},"data":data}) : helper)))
    + "</span>\n		"
    + alias4(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"name","hash":{},"data":data}) : helper)))
    + "\n	</div>\n";
},"16":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "	<div class=\"menu-simple-text\">"
    + container.escapeExpression(container.lambda(((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.reading : stack1)) != null ? stack1["empty-bookmarks"] : stack1), depth0))
    + "</div>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {});

  return "\n\n"
    + ((stack1 = helpers.each.call(alias1,(depth0 != null ? depth0.bookmarks : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0, blockParams, depths),"inverse":container.program(12, data, 0, blockParams, depths),"data":data})) != null ? stack1 : "")
    + "\n<!--\n\n"
    + ((stack1 = helpers.each.call(alias1,(depth0 != null ? depth0.bookmarks : depth0),{"name":"each","hash":{},"fn":container.program(14, data, 0, blockParams, depths),"inverse":container.program(16, data, 0, blockParams, depths),"data":data})) != null ? stack1 : "")
    + "\n-->";
},"useData":true,"useDepths":true});

templatesCache['reading.elements.menus.html'] = hb.template({"1":function(container,depth0,helpers,partials,data) {
    return " a";
},"3":function(container,depth0,helpers,partials,data) {
    return " disable-pointer";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, alias3=depth0 != null ? depth0 : (container.nullContext || {}), alias4=helpers.helperMissing;

  return "<div class=\"menu\" id=\"reading-magnifying-glass\">\n	<div class=\"menu-simple elevation8\" style=\"width: 256px;\">\n		<div class=\"menu-simple-text\">\n			"
    + alias2(alias1(((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.reading : stack1)) != null ? stack1.magnifyingGlass : stack1)) != null ? stack1.activate : stack1), depth0))
    + "\n			<div class=\"switch"
    + ((stack1 = helpers["if"].call(alias3,((stack1 = (depth0 != null ? depth0.config : depth0)) != null ? stack1.readingMagnifyingGlass : stack1),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\" on=\"reading.activeMagnifyingGlass(true)\" off=\"reading.activeMagnifyingGlass(false)\"></div>\n		</div>\n		<div class=\"simple-slider\">\n			<div class=\"simple-slider-text\">"
    + alias2(alias1(((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.reading : stack1)) != null ? stack1.magnifyingGlass : stack1)) != null ? stack1.zoom : stack1), depth0))
    + "<div><span>"
    + alias2((helpers.normalizeNumber || (depth0 && depth0.normalizeNumber) || alias4).call(alias3,((stack1 = (depth0 != null ? depth0.config : depth0)) != null ? stack1.readingMagnifyingGlassZoom : stack1),"0.1",{"name":"normalizeNumber","hash":{},"data":data}))
    + "</span>x</div></div>\n			<input class=\"range\" type=\"range\" max=\"6\" min=\"1.5\" step=\"0.1\" value=\""
    + alias2(alias1(((stack1 = (depth0 != null ? depth0.config : depth0)) != null ? stack1.readingMagnifyingGlassZoom : stack1), depth0))
    + "\" onrange=\"reading.changeMagnifyingGlass(1, {{value}}, {{toEnd}})\">\n		</div>\n		<div class=\"simple-slider\">\n			<div class=\"simple-slider-text\">"
    + alias2(alias1(((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.reading : stack1)) != null ? stack1.magnifyingGlass : stack1)) != null ? stack1.size : stack1), depth0))
    + "<div><span>"
    + alias2(alias1(((stack1 = (depth0 != null ? depth0.config : depth0)) != null ? stack1.readingMagnifyingGlassSize : stack1), depth0))
    + "</span>px</div></div>\n			<input class=\"range\" type=\"range\" max=\"500\" min=\"100\" step=\"2\" value=\""
    + alias2(alias1(((stack1 = (depth0 != null ? depth0.config : depth0)) != null ? stack1.readingMagnifyingGlassSize : stack1), depth0))
    + "\" onrange=\"reading.changeMagnifyingGlass(2, {{value}}, {{toEnd}})\">\n		</div>\n		<div class=\"simple-slider\">\n			<div class=\"simple-slider-text\">"
    + alias2(alias1(((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.reading : stack1)) != null ? stack1.magnifyingGlass : stack1)) != null ? stack1.ratio : stack1), depth0))
    + "<div><span>"
    + alias2((helpers.normalizeNumber || (depth0 && depth0.normalizeNumber) || alias4).call(alias3,((stack1 = (depth0 != null ? depth0.config : depth0)) != null ? stack1.readingMagnifyingGlassRatio : stack1),"0.01",{"name":"normalizeNumber","hash":{},"data":data}))
    + "</span>:1</div></div>\n			<input class=\"range\" type=\"range\" max=\"2\" min=\"0.5\" step=\"0.01\" value=\""
    + alias2(alias1(((stack1 = (depth0 != null ? depth0.config : depth0)) != null ? stack1.readingMagnifyingGlassRatio : stack1), depth0))
    + "\" onrange=\"reading.changeMagnifyingGlass(3, {{value}}, {{toEnd}})\">\n		</div>\n		<div class=\"simple-slider\">\n			<div class=\"simple-slider-text\">"
    + alias2(alias1(((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.reading : stack1)) != null ? stack1.magnifyingGlass : stack1)) != null ? stack1.radius : stack1), depth0))
    + "<div><span>"
    + alias2(alias1(((stack1 = (depth0 != null ? depth0.config : depth0)) != null ? stack1.readingMagnifyingGlassRadius : stack1), depth0))
    + "</span>px</div></div>\n			<input class=\"range\" type=\"range\" max=\"250\" min=\"0\" step=\"1\" value=\""
    + alias2(alias1(((stack1 = (depth0 != null ? depth0.config : depth0)) != null ? stack1.readingMagnifyingGlassRadius : stack1), depth0))
    + "\" onrange=\"reading.changeMagnifyingGlass(4, {{value}}, {{toEnd}})\">\n		</div>\n	</div>\n	<div class=\"menu-close\" onclick=\"reading.magnifyingGlassControl(2); events.desactiveMenu('#reading-magnifying-glass', '.bar-right-buttons .button-magnifying-glass');\"></div>\n</div>\n<div class=\"menu reading-elements-menus\" id=\"reading-pages\">\n	<div class=\"menu-simple elevation8\" style=\"width: 300px;\">\n		<div class=\"menu-simple-element pages-slide\" onclick=\"reading.changePagesView(1, 'slide', false);\">"
    + alias2(alias1(((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.reading : stack1)) != null ? stack1.pages : stack1)) != null ? stack1.slide : stack1), depth0))
    + "</div>\n		<div class=\"menu-simple-element pages-scroll\" onclick=\"reading.changePagesView(1, 'scroll', false);\">"
    + alias2(alias1(((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.reading : stack1)) != null ? stack1.pages : stack1)) != null ? stack1.scroll : stack1), depth0))
    + "</div>\n		<div class=\"menu-simple-separator\"></div>\n		<div class=\"menu-simple-text reading-reading-manga\">\n			"
    + alias2(alias1(((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.reading : stack1)) != null ? stack1.pages : stack1)) != null ? stack1.readingManga : stack1), depth0))
    + "\n			<div class=\"switch"
    + ((stack1 = helpers["if"].call(alias3,((stack1 = (depth0 != null ? depth0.config : depth0)) != null ? stack1.readingManga : stack1),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\" on=\"reading.changePagesView(8, true, false)\" off=\"reading.changePagesView(8, false, false)\"></div>\n		</div>\n		<div class=\"menu-simple-separator\"></div>\n		<div class=\"menu-simple-text reading-double-page\">\n			"
    + alias2(alias1(((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.reading : stack1)) != null ? stack1.pages : stack1)) != null ? stack1.doublePage : stack1), depth0))
    + "\n			<div class=\"switch"
    + ((stack1 = helpers["if"].call(alias3,((stack1 = (depth0 != null ? depth0.config : depth0)) != null ? stack1.readingDoublePage : stack1),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\" on=\"reading.changePagesView(6, true, false)\" off=\"reading.changePagesView(6, false, false)\"></div>\n		</div>\n		<div class=\"menu-simple-text reading-do-not-apply-to-horizontals"
    + ((stack1 = helpers.unless.call(alias3,((stack1 = (depth0 != null ? depth0.config : depth0)) != null ? stack1.readingDoublePage : stack1),{"name":"unless","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\">\n			"
    + alias2(alias1(((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.reading : stack1)) != null ? stack1.pages : stack1)) != null ? stack1.doNotApplyToHorizontals : stack1), depth0))
    + "\n			<div class=\"switch"
    + ((stack1 = helpers["if"].call(alias3,((stack1 = (depth0 != null ? depth0.config : depth0)) != null ? stack1.readingDoNotApplyToHorizontals : stack1),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\" on=\"reading.changePagesView(7, true, false)\" off=\"reading.changePagesView(7, false, false)\"></div>\n		</div>\n		<div class=\"menu-simple-separator\"></div>\n		<div class=\"menu-simple-text reading-ajust-to-width"
    + ((stack1 = (helpers.compare || (depth0 && depth0.compare) || alias4).call(alias3,((stack1 = (depth0 != null ? depth0.config : depth0)) != null ? stack1.readingView : stack1),"==","slide",{"name":"compare","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\">\n			"
    + alias2(alias1(((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.reading : stack1)) != null ? stack1.pages : stack1)) != null ? stack1.adjustToWidth : stack1), depth0))
    + "\n			<div class=\"switch"
    + ((stack1 = helpers["if"].call(alias3,((stack1 = (depth0 != null ? depth0.config : depth0)) != null ? stack1.readingViewAdjustToWidth : stack1),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\" on=\"reading.changePagesView(3, true, false)\" off=\"reading.changePagesView(3, false, false)\"></div>\n		</div>\n		<div class=\"simple-slider\">\n			<div class=\"simple-slider-text\">"
    + alias2(alias1(((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.reading : stack1)) != null ? stack1.pages : stack1)) != null ? stack1.margin : stack1), depth0))
    + "<div><span>"
    + alias2(alias1(((stack1 = ((stack1 = (depth0 != null ? depth0.config : depth0)) != null ? stack1.readingMargin : stack1)) != null ? stack1.margin : stack1), depth0))
    + "</span>px</div></div>\n			<input class=\"range\" type=\"range\" max=\"100\" min=\"0\" step=\"1\" value=\""
    + alias2(alias1(((stack1 = ((stack1 = (depth0 != null ? depth0.config : depth0)) != null ? stack1.readingMargin : stack1)) != null ? stack1.margin : stack1), depth0))
    + "\" onrange=\"reading.changePagesView(2, {{value}}, {{toEnd}})\">\n		</div>\n		<div class=\"menu-simple-separator\"></div>\n		<div class=\"simple-slider\">\n			<div class=\"simple-slider-text\">"
    + alias2(alias1(((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.reading : stack1)) != null ? stack1.pages : stack1)) != null ? stack1.readingDelaySkip : stack1), depth0))
    + "<div><span>"
    + alias2((helpers.normalizeNumber || (depth0 && depth0.normalizeNumber) || alias4).call(alias3,((stack1 = (depth0 != null ? depth0.config : depth0)) != null ? stack1.readingDelayComicSkip : stack1),"0.2",{"name":"normalizeNumber","hash":{},"data":data}))
    + "</span>s</div></div>\n			<input class=\"range\" type=\"range\" max=\"10\" min=\"0\" step=\"0.1\" value=\""
    + alias2(alias1(((stack1 = (depth0 != null ? depth0.config : depth0)) != null ? stack1.readingDelayComicSkip : stack1), depth0))
    + "\" onrange=\"reading.changePagesView(5, {{value}}, {{toEnd}})\">\n		</div>\n		<div class=\"simple-slider\">\n			<div class=\"simple-slider-text\">"
    + alias2(alias1(((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.reading : stack1)) != null ? stack1.pages : stack1)) != null ? stack1.animationSpeed : stack1), depth0))
    + "<div><span>"
    + alias2((helpers.normalizeNumber || (depth0 && depth0.normalizeNumber) || alias4).call(alias3,((stack1 = (depth0 != null ? depth0.config : depth0)) != null ? stack1.readingViewSpeed : stack1),"0.05",{"name":"normalizeNumber","hash":{},"data":data}))
    + "</span>s</div></div>\n			<input class=\"range\" type=\"range\" max=\"4\" min=\"0\" step=\"0.05\" value=\""
    + alias2(alias1(((stack1 = (depth0 != null ? depth0.config : depth0)) != null ? stack1.readingViewSpeed : stack1), depth0))
    + "\" onrange=\"reading.changePagesView(4, {{value}}, {{toEnd}})\">\n		</div>\n	</div>\n	<div class=\"menu-close\" onclick=\"reading.magnifyingGlassControl(2); events.desactiveMenu('#reading-pages', '.bar-right-buttons .button-book-open-page-variant');\"></div>\n</div>\n<div class=\"menu\" id=\"collections-bookmark\">\n	<div class=\"menu-simple elevation8\" style=\"width: 256px;\"></div>\n	<div class=\"menu-close\" onclick=\"reading.magnifyingGlassControl(2); events.desactiveMenu('#collections-bookmark', '.bar-right-buttons .button-collections-bookmark');\"></div>\n</div>\n<script type=\"text/javascript\">\n	dom.selectElement('.pages-"
    + alias2(alias1(((stack1 = (depth0 != null ? depth0.config : depth0)) != null ? stack1.readingView : stack1), depth0))
    + "');	\n</script>";
},"useData":true});

templatesCache['reading.header.html'] = hb.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1;

  return ((stack1 = helpers.each.call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? depth0.headerTitlePath : depth0),{"name":"each","hash":{},"fn":container.program(2, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "");
},"2":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=helpers.helperMissing, alias3=container.escapeExpression;

  return "			<span class=\"bar-title-a\" onclick=\"reading.saveReadingProgress(); dom.loadIndexPage(true, '"
    + alias3((helpers.chain || (depth0 && depth0.chain) || alias2).call(alias1,"escapeBackSlash","escapeQuotesSimples",(depth0 != null ? depth0.path : depth0),{"name":"chain","hash":{},"data":data}))
    + "', false, false, '"
    + alias3((helpers.chain || (depth0 && depth0.chain) || alias2).call(alias1,"escapeBackSlash","escapeQuotesSimples",(depth0 != null ? depth0.mainPath : depth0),{"name":"chain","hash":{},"data":data}))
    + "')\">"
    + alias3(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias2),(typeof helper === "function" ? helper.call(alias1,{"name":"name","hash":{},"data":data}) : helper)))
    + "</span>\n			"
    + ((stack1 = helpers.unless.call(alias1,(depth0 != null ? depth0.last : depth0),{"name":"unless","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n";
},"3":function(container,depth0,helpers,partials,data) {
    return " / ";
},"5":function(container,depth0,helpers,partials,data) {
    var stack1;

  return ((stack1 = helpers["if"].call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? depth0.headerTitle : depth0),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.program(8, data, 0),"data":data})) != null ? stack1 : "")
    + "	";
},"6":function(container,depth0,helpers,partials,data) {
    var helper;

  return "			"
    + container.escapeExpression(((helper = (helper = helpers.headerTitle || (depth0 != null ? depth0.headerTitle : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"headerTitle","hash":{},"data":data}) : helper)))
    + "\n";
},"8":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "			"
    + container.escapeExpression(container.lambda(((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.global : stack1)) != null ? stack1.comics : stack1), depth0))
    + "\n";
},"10":function(container,depth0,helpers,partials,data) {
    return "moon";
},"12":function(container,depth0,helpers,partials,data) {
    return "sun";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.escapeExpression, alias3=container.lambda;

  return "<div class=\"bar-back material-icon button button2 hover-text "
    + alias2(((helper = (helper = helpers["bar-back"] || (depth0 != null ? depth0["bar-back"] : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"bar-back","hash":{},"data":data}) : helper)))
    + "\" hover-text=\""
    + alias2(alias3(((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.global : stack1)) != null ? stack1.back : stack1), depth0))
    + "\" onclick=\"reading.saveReadingProgress();dom.indexPathControlGoBack()\">arrow_back</div>\n<div class=\"bar-title\" style=\"max-width: calc(100% - (528px + 68px));\">\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.headerTitlePath : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(5, data, 0),"data":data})) != null ? stack1 : "")
    + "</div>\n<div class=\"bar-right-buttons reading-header\">\n	<div>\n		<div class=\"material-icon button button1 button-magnifying-glass hover-text\" hover-text=\""
    + alias2(alias3(((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.reading : stack1)) != null ? stack1.magnifyingGlass : stack1)) != null ? stack1.main : stack1), depth0))
    + "\" onclick=\"events.activeMenu('#reading-magnifying-glass', '.bar-right-buttons .button-magnifying-glass', 'right');\">search</div>\n		<div class=\"material-icon-extras button button1 button-book-open-page-variant hover-text\" hover-text=\""
    + alias2(alias3(((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.reading : stack1)) != null ? stack1.pages : stack1)) != null ? stack1.main : stack1), depth0))
    + "\" onclick=\"events.activeMenu('#reading-pages', '.bar-right-buttons .button-book-open-page-variant', 'right');\">page_variant</div>\n		<div class=\"bar-buttons-separator\"></div>\n		<div class=\"material-icon button button1 button-collections-bookmark hover-text\" hover-text=\""
    + alias2(alias3(((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.reading : stack1)) != null ? stack1.viewBookmarks : stack1), depth0))
    + "\" onclick=\"reading.loadBookmarks();events.activeMenu('#collections-bookmark', '.bar-right-buttons .button-collections-bookmark', 'right');\">collections_bookmark</div>\n		<div class=\"material-icon button button2 button-bookmark hover-text\" hover-text=\""
    + alias2(alias3(((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.reading : stack1)) != null ? stack1.addBookmark : stack1), depth0))
    + "\" onclick=\"reading.createAndDeleteBookmark();\">bookmark_border</div>\n		<div class=\"bar-buttons-separator\"></div>\n		<div class=\"material-icon button button2 hover-text\" hover-text=\""
    + alias2(alias3(((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.reading : stack1)) != null ? stack1.lastPage : stack1), depth0))
    + "\" onclick=\"reading.goEnd();\">last_page</div>\n		<div class=\"material-icon button button2 hover-text\" hover-text=\""
    + alias2(alias3(((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.reading : stack1)) != null ? stack1.next : stack1), depth0))
    + "\" onclick=\"reading.goNext();\">navigate_next</div>\n		<div class=\"material-icon button button2 hover-text\" hover-text=\""
    + alias2(alias3(((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.reading : stack1)) != null ? stack1.previous : stack1), depth0))
    + "\" onclick=\"reading.goPrevious();\">navigate_before</div>\n		<div class=\"material-icon button button2 hover-text\" hover-text=\""
    + alias2(alias3(((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.reading : stack1)) != null ? stack1.firstPage : stack1), depth0))
    + "\" onclick=\"reading.goStart();\">first_page</div>\n		<div class=\"bar-buttons-separator\"></div>\n		<div class=\"material-icon-extras button button2 button-night-mode hover-text\" hover-text=\""
    + alias2(alias3(((stack1 = ((stack1 = (depth0 != null ? depth0.language : depth0)) != null ? stack1.global : stack1)) != null ? stack1.nightMode : stack1), depth0))
    + "\" onclick=\"dom.nightMode();\">"
    + ((stack1 = helpers["if"].call(alias1,((stack1 = (depth0 != null ? depth0.config : depth0)) != null ? stack1.nightMode : stack1),{"name":"if","hash":{},"fn":container.program(10, data, 0),"inverse":container.program(12, data, 0),"data":data})) != null ? stack1 : "")
    + "</div>\n\n	</div>\n</div>";
},"useData":true});

templatesCacheTheme['material-design'] = {};

module.exports = {templatesCacheTheme: templatesCacheTheme, templatesCache: templatesCache};