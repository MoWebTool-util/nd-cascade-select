'use strict';

var areaData = require('nd-area-data');
var cascadeSelect = require('nd-cascade-select');

module.exports = {
  name: 'tabSelect',
  starter: function () {

    var plugin = this,
      host = plugin.host;

    var _widgets = plugin.exports = {};

    function addWidget(name, instance) {
      instance.on('setData', function (index, value) {
        instance.set('data', areaData.getItems(index === 1 ? areaData.city() : areaData.district(), value));
      });

      /* instance.set('data', areaData.province());*/
      _widgets[name] = instance;

      plugin.trigger('export', instance, name);
    }

//'{"province":"福建省","provinceCode":"350000","city":"莆田市","cityCode":"350300","district":"仙游县","districtCode":"350322"}'

    plugin.execute = function () {
      addWidget('area', new cascadeSelect({
        trigger: '[name=area]',
        maxHeight: 300,
        tabs: [{
          text: '省份',
          role: 'province'
        }, {
          text: '城市',
          role: 'city'
        }, {
          text: '县区',
          role: 'district'
        }],
        inFilter: function (data) {
          try{
            data = JSON.parse(data);
            return [data.province, data.city, data.district].join(this.get('delimiter'));
          }catch(e) {
            return data;
          }
        },
        afterRender: function () {
          var that = this,
            data;
          try{
            data= JSON.parse(this.get('value'));
          }catch(e){
            return this.set('data', areaData.province());
          }

          var province = data.provinceCode,
            city = data.cityCode,
            district = data.districtCode;
          for (var i = 0, l = this.get('tabs').length; i < l; i++) {
            this.set('index', i);
            switch (i) {
              case 0:
                that.set('data', areaData.province());
                that.$('[data-role=province]').find('[data-id=' + province + ']').click();
                break;
              case 1:
                that.set('data', areaData.getItems(areaData.city(), province));
                that.$('[data-role=city]').find('[data-id=' + city + ']').click();
                break;
              case 2:
                that.set('data', areaData.getItems(areaData.district(), city));
                that.$('[data-role=district]').find('[data-id=' + district + ']').click();
                break;
            }
          }
          this.set('index', 0);
        }

      }).render());
    };

    host.after('render', plugin.execute);
    // host.after('addField', plugin.execute);

    host.before('destroy', function () {
      Object.keys(_widgets).forEach(function (key) {
        _widgets[key].destroy();
      });
    });

    plugin.getWidget = function (name) {
      return _widgets[name];
    };

    // 通知就绪
    this.ready();

  }
};
