exports.getFieldOptions = (function () {

  return function (cb) {
    var fields = [
      {
        name: 'area',
        label: '地区',
        //value:'{"province":"福建省","provinceCode":"350000","city":"莆田市","cityCode":"350300","district":"仙游县","districtCode":"350322"}',
        attrs:{
          required: 'required',
          placeholder:'请选择省市区',
          'data-display':'完整地区信息'
        }
      }
    ];

    return cb ? cb(fields) : fields;
  };

})();
