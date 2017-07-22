var Util = {
	// 获取模板内容
	tpl: function (id) {
		return document.getElementById(id).innerHTML;
	},
	// 异步请求方法
	ajax: function (url, fn) {
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function () {
			if (xhr.readyState === 4) {
				if (xhr.status === 200 || xhr.status === 304) {
					fn && fn(xhr.responseText)
				}
			}
		}
		xhr.open('GET', url, true);
		xhr.send();
	}
}

// 处理价格的过滤器
Vue.filter('price', function (value) {
	return value + '元'
})
// 处理门市价的过滤器
Vue.filter('orignPrice', function (value) {
	return '门市价:' + value + '元';
})
// 处理销售过滤器
Vue.filter('sales', function (value) {
	return '已售' + value;
})
// 处理显示更过过滤器
Vue.filter('loadMore', function (value) {
	return '查看其他' + value + '条团购'
})

/* 首页组件 */
var Home = Vue.extend({
	template: Util.tpl('tpl_home'),
	data: function () {
		return {
			types: [
				{id: 1, title: '美食', url: '01.png'},
				{id: 2, title: '电影', url: '02.png'},
				{id: 3, title: '酒店', url: '03.png'},
				{id: 4, title: '休闲娱乐', url: '04.png'},
				{id: 5, title: '外卖', url: '05.png'},
				{id: 6, title: 'KTV', url: '06.png'},
				{id: 7, title: '周边游', url: '07.png'},
				{id: 8, title: '丽人', url: '08.png'},
				{id: 9, title: '小吃快餐', url: '09.png'},
				{id: 10, title: '火车票', url: '10.png'}
			],
			ad: [],
			list: []
		}
	},
	// 组件创建后执行
	created: function () {
		// 显示搜索框
		this.$parent.hideSearch = true;
		var that = this;
		Util.ajax('data/home.json', function (res) {
			// 将返回的数据转化为json
			res = JSON.parse(res);
			if (res.errno === 0) {
				// 添加广告数据
				that.$set('ad', res.data.ad)
				// 添加列表数据
				that.$set('list', res.data.list)
			}
			
		})
	}
})

/* 列表页组件 */
var List = Vue.extend({
	template: Util.tpl('tpl_list'),
	data: function () {
		return {
			types: [
				{value: '价格排序', key: 'price'},
				{value: '销量排序', key: 'sales'},
				{value: '好评排序', key: 'evaluate'},
				{value: '优惠排序', key: 'discount'}
			],
			// 显示商品列表
			list: [],
			// 剩余商品列表
			other: []
		}
	},
	events: {
		'reload-list': function () {
			this.load();
		}
	},
	// 组件创建后执行
	created: function () {
		// 显示搜索框
		this.$parent.hideSearch = true;
		this.load();
	},
	methods: {
		// 将请求数据的逻辑封装在里面
		load: function () {
			var that = this;
			// 通过parent的query数据我们可以拿到hash上的信息，来拼凑请求query
			var query = that.$parent.query;
			// 拼凑query字符串
			var queryStr = '';
			if (query && query.length === 2) {
				queryStr = '?' + query[0] + '=' + query[1]
			}
			// 请求列表数据渲染到页面中
			Util.ajax('data/list.json' + queryStr, function (res) {
				// 将res转化成js对象
				res = JSON.parse(res);
				if (res.errno === 0) {
					// 打乱返回数据的顺序
					res.data.sort(function () {
						return Math.random() > .5 ? 1 : -1;
					})
					// 将前三个保存在list中
					that.$set('list', res.data.slice(0, 3))
					// 后面的保存在ohter
					that.$set('other', res.data.slice(3))
				}
			})
		},
		// 为查看更多按钮绑定事件
		loadMore: function () {
			// 把剩余ohter的商品放到list
			this.list = [].concat(this.list, this.other);
			// 将ohter清空
			this.other = [];
		},
		// 点击排序按钮，对list排序
		// price sales evaluate 这三个属性，是list列表中每个成员对象中属性，所以我们可以根据该属性对列表成员排序
		sortBy: function (key) {
			this.list.sort(function (a, b) {
				// a ,b 表示list数组中成员，所以该成员句该key属性
				if (key === 'discount') {
					// 用原价减去售价排序
					return (b.orignPrice - b.price) - (a.orignPrice - a.price)	
				} else {
					// 由小到大排序
					// return a[key] - b[key]
					// 由大到小排序
					return b[key] - a[key]
				}
			})
		}
	}
})

/* 商品组件 */
var Product = Vue.extend({
	template: Util.tpl('tpl_product'),
	data: function () {
		return {
			// 我们请求数据data是个对象，不是数组，所以我们给product定义为一个对象
			product: {
				src: '01.jpg'
			}
		}
	},
	created: function () {
		var that = this;
		// hideSearch 设置成false来隐藏search元素
		this.$parent.hideSearch = false;
		Util.ajax('data/product.json', function (res) {
			// 将res字符串转化成对象
			res = JSON.parse(res);
			if (res.errno === 0) {
				// 将res的data数据保存在product变量中
				that.$set('product', res.data)
			}
		})
	}
})

Vue.component('home', Home)
Vue.component('list', List)
Vue.component('product', Product)

var app = new Vue({
	el: '#app',
	data: {
		view: '',
		// 存储哈希中信息的
		query: [],
		hideSearch: true
	},
	methods: {
		// 为搜索框绑定搜索事件
		search: function (e) {
			// 通过当前对象获取搜索框的数据
			var value = e.target.value;
			// 将value放在hash #list/search/value
			location.hash = '#list/search/' + value;
			// console.log(value)
		}
	}
})

// 路由
var route = function () {
	// 每次当hash改变的时候，我们要将它获取出来，根据hash值来渲染页面
	// #list\type\1 =》 list\type\1
	// var hash = location.hash.slice(1);
	var hash = location.hash;
	// #\list\type\1 或者 #list\type\1 => list
	// 处理字符串
	hash = hash.slice(1).replace(/^\//, '');
	// 将字符串转化成数组
	hash = hash.split('/')

	// 列表页失效问题产生的原因
	// 当前页面的view组件是list(app.view)，搜索后得到的view组件还是list(hash[0])
	if (app.view === hash[0] && hash[0] === 'list') {
		// 父组件向子组件发送消息 成功通过父组件app向子组件发送消息
		app.query = hash.slice(1)
		app.$broadcast('reload-list')
		return ;
	}

	// 根据hash值选择视图组件
	app.query = hash.slice(1)
	app.view = hash[0] || 'home';
	
	// console.log(111)
}

// 对hash改变注册事件
window.addEventListener('hashchange', route)
window.addEventListener('load', route)