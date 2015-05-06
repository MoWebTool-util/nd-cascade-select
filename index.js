/**
 * @module: nd-cascade-select
 * @author: lzhengms <lzhengms@gmail.com> - 2015-05-04 15:11:38
 */

'use strict';


var $ = require('jquery'),
  Overlay = require('nd-overlay'),
  Template = require('nd-template');

var tpl = {
  partial: require('./src/options.handlebars'),
  template: require('./src/select.handlebars')
};

//Helpers

function getClassName(classPrefix, className) {
  if (!classPrefix) {
    return '';
  }
  return classPrefix + '-' + className;
}

//sort

function quickSort(key) {
  return function (arr) {
    if (arr.length <= 1) return arr;
    var left = [];
    var right = [];
    var proitIndex = Math.floor(arr.length / 2);
    var proit = arr.splice(proitIndex, 1)[0];
    for (var i = 0; i < arr.length; i++) {
      if (arr[i][key] < proit[key]) {
        left.push(arr[i]);
      } else {
        right.push(arr[i]);
      }
    }
    return quickSort(key)(left).concat(proit, quickSort(key)(right));
  }
}

// 高度
function getWrapHeight(wrap) {
  var height = 0;
  wrap.find('a').each(function (index, item) {
    height += $(item).outerHeight();
  });
  return height;
}


//'{"province":"福建省","provinceCode":"350000","city":"莆田市","cityCode":"350300","district":"仙游县","districtCode":"350322"}'
var cascadeSelect = Overlay.extend({

  Implements: Template,

  attrs: {
    classPrefix: 'tab-select',
    titleActiveClass: 'active',
    itemSelectedClass: 'selected',
    itemHoverClass: 'item-hover',
    triggerClass: 'trigger',

    trigger: {
      value: null,
      getter: function (val) {
        return $(val).eq(0);
      }
    },
    triggerTpl: '<a href="#"></a>',

    template: tpl.template,
    partial: tpl.partial,
    index: 0,
    align: {
      baseXY: [0, '100%-1px']
    },
    maxHeight: null,
    delimiter: '/',


    data: null,
    tabs: null,
    selected: null,

    value: {
      value: null,
      getter: function () {

        var trigger = this.get('originTrigger')[0];
        return trigger.value || trigger.placeholder;
      },
      setter: function (val) {

        if (typeof val === 'object' || $.isArray(val)) {
          val = JSON.stringify(val);
        }

        this.get('originTrigger')[0].value = val || '';
        return val;
      }
    },

    inFilter: function (value) {
      return value;
    },

    outFilter: function (data) {
      return data;
    },

    outValues: function (list) {
      return this.getValues().splice(-1);
    }
  },

  events: {
    'click [data-role=select-tab]': function (e) {
      var target = $(e.currentTarget),
        index = target.index();
      this.set('index', index);
    },
    'click [data-role=select-item]': function (e) {
      var target = $(e.currentTarget),
        selectedClass = getClassName(this.get('classPrefix'), this.get('itemSelectedClass'));
      target.siblings().removeClass(selectedClass);
      target.addClass(selectedClass);
      this.select(target);
    },
    'mouseenter [data-role=select-item]': function (e) {
      var target = $(e.currentTarget);
      target.addClass(getClassName(this.get('classPrefix'), this.get('itemHoverClass')))
    },
    'mouseleave [data-role=select-item]': function (e) {
      var target = $(e.currentTarget);
      target.removeClass(getClassName(this.get('classPrefix'), this.get('itemHoverClass')))
    }
  },

  initAttrs: function (config) {
    multiTabSelect.superclass.initAttrs.call(this, config);

    var trigger = this.get('trigger'),
      newTrigger = $(this.get('triggerTpl')).addClass(getClassName(this.get('classPrefix'), this.get('triggerClass')));

    trigger.after(newTrigger).css({
      position: 'absolute',
      left: '-9999px',
      zIndex: -100
    });

    this.set('originTrigger', trigger);
    this.set('trigger', newTrigger);
    this.set('model', {
      tabs: this.get('tabs')
    });

  },

  setup: function () {
    this._bindEvents();
    this._alignDefaultValue();
    this._initHeight();
    this._blurHide(this.get('trigger'));
    this.setTriggerContent(this.get('inFilter').call(this, this.get('value')));
    multiTabSelect.superclass.setup.call(this);
  },

  render: function () {
    multiTabSelect.superclass.render.call(this);
    this._setTriggerWidth();
    return this;
  },

  select: function (target) {

    var that = this,
      value = target.data('id'),
      text = target.text(),
      length = this.get('tabs').length,
      index = this.get('index'),
      next = index + 1,
      selectList = this.get('selected') || [];


    $.each(selectList, function (i, item) {
      if (item.index === index) {
        selectList.splice(i, 1);
        return false;
      }
    });

    selectList.push({
      index: index,
      value: value,
      text: text
    });

    //对selectList按照index排序
    selectList = quickSort('index')(selectList);
    this.set('length', next);
    next >= length ? this.hide() : (function () {
      //选了除了最后一个面板都要
      selectList.splice(next, length - next);
      //清空后面的板块内容
      that._getWraps().eq(index).nextAll('div').empty();
      //切换到下一个面板
      that.set('index', next);
      //重置值
      that.set('value', '');
      //设置这个板块的数据
      /** index   当前板块的索引
       *  value   在当前板块选中的项的id
       */
      that.trigger('setData', next, value);
    })();

    this.set('selected', selectList);

    this.setValues();
  },

  //set回调
  _onRenderIndex: function (index) {
    var wraps = this._getWraps(),
      tabs = this._getTabs(),
      curTab = tabs.eq(index);

    curTab.addClass(getClassName(this.get('classPrefix'), this.get('titleActiveClass')));
    curTab.siblings().removeClass(getClassName(this.get('classPrefix'), this.get('titleActiveClass')));
    wraps.hide();
    wraps.eq(index).show();
    this._setHeight();
  },

  _onRenderData: function (data) {
    var model = this.get('model');
    model.list = data || [];
    this._getWraps().eq(this.get('index')).html(this.get('partial')(model));
    this._setHeight();
  },

  _onRenderSelected: function (list) {
    var values = [], texts = [];
    $.each(list, function (i, item) {
      values.push(item.value);
      texts.push(item.text);
    });
    this.set('values', values);
    this.set('texts', texts);
    //处理成自己想要的数据格式
    this.get('outFilter').call(this, list);
  },

  //私有方法
  _getWraps: function () {
    return this.$('[data-role=content]').children('div');
  },

  _getTabs: function () {
    return this.$('[data-role=select-tab]');
  },

  _bindEvents: function () {
    this.delegateEvents(this.get('trigger'), 'click', function (e) {
      e.preventDefault();
      this.get('visible') ? this.hide() : this.show();
    });
  },

  _alignDefaultValue: function () {
    this.get('align').baseElement = this.get('trigger');
  },


  _setTriggerWidth: function () {
    var trigger = this.get('trigger');

    trigger.css('width', this.element.outerWidth());

    // 因为 trigger 的宽度可能受 CSS（如 max-width） 限制，
    // 最后将 element 的宽度设置为与 trigger 等宽
    this.element.css('width', trigger.outerWidth());
  },

  _setHeight: function () {
    var maxHeight = this.get('maxHeight');

    if (maxHeight) {
      var wrap = this._getWraps().eq(this.get('index'));
      var height = getWrapHeight(wrap);

      this.$('[data-role=content]').css('height', height > maxHeight ? maxHeight : '');
      wrap.scrollTop(0);
    }
  },

  _initHeight: function () {
    this.after('show', function () {
      this._setHeight();
    });
  },

  //接口方法
  setTriggerContent: function (text) {
    var trigger = this.get('trigger'),
      con = trigger.find('[data-role=content]');
    if (con && con.length) {
      con.html(text);
    } else {
      trigger.html(text);
    }
  },

  getValues: function () {
    return this.get('values');
  },

  getTexts: function () {
    return this.get('texts');
  },

  getSelected: function () {
    return this.get('selected');
  },

  setValues: function () {
    //设置要显示的数据和提交的数据
    this.setTriggerContent(this.getTexts().join(this.get('delimiter')));
    //必须全部选择了才设置值
    if (this.get('length') === this.get('tabs').length) {
      this.set('value', this.get('outValues').call(this, this.getSelected()));
    }
  }

});


module.exports = cascadeSelect;
