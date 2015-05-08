'use strict';

var formUtil = require('./data');



module.exports = function () {

  this.options = {
    // 操作按钮
    // button: {
    //   // role:
    //   text: '测试',
    //   // both|header|footer,
    //   place: 'both',
    //   disabled: true
    // },

    // 表单选项
    formData: {
      // 'need_send_im': 0
    },

    fields: formUtil.getFieldOptions(),


    plugins:[require('./index')]

    /*,

     plugins:[require('../util/plugins/session')]*/


  };



  // return false, will prevent starter

};
