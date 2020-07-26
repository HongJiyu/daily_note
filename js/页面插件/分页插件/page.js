'use strict';
/**
 * 自定义分页（封装实现）
 * @type {Page}
 * @data：2019-06-02
 * @author：lzw，hjy
 */

const P = new Page();
// 分页对象
function Page() {
        //	{"elemId":"#Page","pageIndex":12,"total":"123","pageNum":"7","pageSize":"10"}
      //	elemId标签  pageIndex 当前页  total 总条数 pageNum 显示多少个页 pageSize 每页的条数 
  this.config = { elemId: '#page', pageIndex: '1', total: '0', pageNum: '7', pageSize: '10' };// 默认参数
  this.version = '1.1';// 分页版本
  this.requestFunction = null;// 分页版本

  // 初始化参数
  this.initMathod = function(obj) {
    $.extend(this.config, obj.params);// 默认参数 + 用户自定义参数
    this.requestFunction = obj.requestFunction;
    this.renderPage();
  };

  // 渲染分页
  this.renderPage = function() {
    this.requestFunction(true); //渲染div，true代表要获取总数，false代表不用。
    $(P.config.elemId).unbind('click'); //解除click绑定，再重新绑定，因为出现了重新渲染后之前的事件没有被清除。
    this.pageHtml(); //渲染页码
    // 分页绑定事件
    $(P.config.elemId).on('click', 'a', function() {
      const flag = $(this).parent().hasClass('disabled');
      if (flag) {
        return false;
      }
      const pageIndex = $(this).data('pageindex');
      P.config.pageIndex = pageIndex;
      P.requestFunction(false);//页码的点击事件不需要查总数，所以false。
      P.pageHtml();
    });
  };

  // 分页合成
  this.pageHtml = function() {
    const data = this.config;
    if (parseInt(data.total) < 0) {
      return false;
    }

    const elemId = data.elemId;
    const pageNum = isBlank(data.pageNum) ? 7 : parseInt(data.pageNum);// 可显示页码个数
    const pageSize = isBlank(data.pageSize) ? 10 : parseInt(data.pageSize);// 可显示页码个数
    const total = parseInt(data.total);// 总记录数
    const pageTotal = total % pageSize != 0 ? parseInt(total / pageSize) + 1 : parseInt(total / pageSize);// 总页数
    const pageIndex = pageTotal < parseInt(data.pageIndex) ? pageTotal : parseInt(data.pageIndex);// 当前页
    const j = pageTotal < pageNum ? pageTotal : pageNum;// 如果总页数小于可见页码，则显示页码为总页数
    const k = pageIndex < parseInt((j / 2) + 1) ? -1 * (pageIndex - 1) : pageIndex > (pageTotal - parseInt(j / 2)) ? -1 * (j - (pageTotal - pageIndex) - 1) : -1 * parseInt((j / 2));// 遍历初始值
    let pageHtml = '<ul>';

    if (pageIndex <= 0 || pageIndex == 1) {
      pageHtml += '<li class="disabled"><a href="javascript:;" data-pageindex="' + pageIndex + '">首页</a></li>' +
        '<li class="disabled"><a href="javascript:;" data-pageindex="' + pageIndex + '">上一页</a></li>';
    } else {
      pageHtml += '<li><a href="javascript:;" data-pageindex="1">首页</a></li>' +
        '<li><a href="javascript:;" data-pageindex="' + (pageIndex - 1) + '">上一页</a></li>';
    }

    for (let i = k; i < (k + j); i++) {
      if (pageTotal == (pageIndex + i - 1)) break;
      if (i == 0) {
        pageHtml += '<li class="active"><a href="javascript:;" data-pageindex="' + pageIndex + '">' + pageIndex + '</a></li>';
      } else {
        pageHtml += '<li><a href="javascript:;" data-pageindex="' + (pageIndex + i) + '">' + (pageIndex + i) + '</a></li>';
      }
    }

    if (pageTotal == 1 || pageTotal <= pageIndex) {
      pageHtml += '<li class="disabled"><a href="javascript:;" data-pageindex="' + pageTotal + '">下一页</a></li>' +
        '<li class="disabled"><a href="javascript:;" data-pageindex="' + pageTotal + '">末页</a></li>';
    } else {
      pageHtml += '<li><a href="javascript:;" data-pageindex="' + (pageIndex + 1) + '">下一页</a></li>' +
        '<li><a href="javascript:;" data-pageindex="' + pageTotal + '">末页</a></li>';
    }
    pageHtml += '</ul>';
    $(elemId).html('');
    $(elemId).html(pageHtml);
  };
}

function isBlank(str) {
  if (str == undefined || str == null || str.trim() == '') {
    return true;
  }
  return false;
}
