/**
 * 基础的music播放js类库-mjs
 * 封装了基本的音乐操作
 * author: lovefc
 * git: https://gitee.com/lovefc/mjs
 * time: 2019/12/24 14:25 * uptime: 2019/12/25 11:00
 * uptime: 2020/06/18 23:30
 * uptime: 2021/10/27 14:21 
 */

'use strice';
; (function (factory) {
	if (typeof exports === "object") {
		module.exports = factory();
	} else if (typeof define === "function" && define.amd) {
		define(factory);
	} else {
		let glob;
		try {
			glob = window;
		} catch (e) {
			glob = self;
		}
		glob.mjs = factory();
	}
})(function () {
	let mjs = function () {
		let that = this;
		if (!new.target) {
			return new mjs()
		};
		this.audio = '';
		this.playStatus = 0;
		this.currentTime = 0;
		this.arrMusic = new Array();
		this.nowPlayNum = 0;
		// 当前的操作
		this.operation;
		this.arrMusicNum = 0;
		this.lycArray = new Array();
		this.newLyc = '';
		this.volume = 1;
		this.currentnum = 0;
		this.order = 0; // 0|顺序,1|随机,2单曲
		this.task;
		this.lycCallback = function () { };
		this.switchCallback = function () { };
		this.timeCallback = function () { };
		this.initCallback = function () { };
		this._lycCallback = async function () {
			if (typeof that.lycCallback === "function") {
				that.lycCallback(that.newLyc);
			}
		};
		this._timeCallback = async function () {
			if (typeof that.timeCallback === "function") {
				let times = new Array();
				times['nowtime'] = that.setTimes(Math.round(that.audio.currentTime));
				times['alltime'] = that.setTimes(Math.round(that.audio.duration));
				let playProgress = Math.round(that.audio.currentTime / that.audio.duration * 100);
				playProgress = isNaN(playProgress) ? 0 : playProgress;
				times['progress'] = playProgress;
				that.timeCallback(times);
			}
		};
		this.timeupdate = function () {
			if (that.lycArray.length > 0) {
				if (that.currentnum == that.lycArray.length - 1 && that.audio.currentTime.toFixed(3) >= parseFloat(that.lycArray[
					that.currentnum].t)) {
					that.newLyc = that.lycArray[that.currentnum].c;
				}
				if (parseInt(that.lycArray[that.currentnum].t) <= parseInt(that.audio.currentTime + 0.05) && parseInt(that.audio
					.currentTime + 0.05) <= parseInt(that.lycArray[that.currentnum + 1].t)) {
					if (that.audio.currentTime > 0) {
						that.newLyc = that.lycArray[that.currentnum].c;
					}
					that.currentnum++;
				}
			}
		};

		// 初始化事件
		this.init = function (data, order, volume, cross) {
			if (!data) return false;
			this.audio = document.createElement('audio');
			if (cross === true) {
				this.audio.crossOrigin = 'anonymous';
				this.audio.controls = false;
			}
			this.audio.src = '';
			if (volume) {
				this.playVolume(parseFloat(volume));
			}
			if (order) {
				this.orderMusic(parseInt(order));
			}
			document.body.appendChild(this.audio);
			this.jsonToArray(data);
			if (typeof this.initCallback === "function") {
				this.initCallback(this.arrMusic[this.nowPlayNum])
			}
			// 监听删除定时器
			this.audio.addEventListener('durationchange', function () {
				window.clearInterval(that.task);
			}, false);
			// 监听错误事件
			this.audio.addEventListener('error', function () {
				that.task = window.setInterval(function () {
					if (!that.audio.duration) {
						if (that.playStatus == 1) {
							if (that.operation === 'add') {
								that.nextMusic();
							}
							if (that.operation === 'minus') {
								that.prevMusic();
							}
						}
					}
				}, 1000);
			}, false);
			// 监听结束事件			
			this.audio.addEventListener('ended', function () {
				that.operation == 'add';
				if (that.playStatus == 1) {
					if (that.order != 2) {
						that.nextMusic();
					} else {
						that.autoPlay();
					}
				}
			}, false);
			// 监听开始
			this.audio.addEventListener('canplay', function () {
				that.audio.ontimeupdate = that.timeupdate;
			}, false);

			// 监听跳转
			this.audio.addEventListener('seeked', function () {
				that._timeCallback();
			}, false);
			// 定时任务,用来定位歌词位置和渲染操作
			let music_currentnum = setInterval(function () {
				if (that.playStatus == 1) {
					that._timeCallback();
					that._lycCallback();
				}
				for (i = 0; i < that.lycArray.length; i++) {
					if (parseInt(that.lycArray[i].t) <= parseInt(that.audio.currentTime + 0.1) && parseInt(that.lycArray[i + 1].t) >=
						parseInt(that.audio.currentTime + 0.1)) {
						that.currentnum = i
					}
				}
			}, 500);
		};
		this.orderMusic = function (num) {
			this.order = +num
		};
		this.playOrder = function () {
			let num = this.order;
			// 从零开始的播放单
			let nowPlayNum = 0;
			switch (num) {
				case 1:
					nowPlayNum = parseInt(Math.random() * (this.arrMusicNum - 1 + 1), 10);
					this.nowPlayNum = nowPlayNum;
					break
				case 2:
					nowPlayNum = this.nowPlayNum;
					break
			}
			return nowPlayNum;
		};
		// 获取aduio对象
		this.getAudio = function () {
			return this.audio;
		};
		this.jsonToArray = function (json) {
			this.arrMusic = new Array();
			if (json == null && json.toString() == '') {
				console.log('json error');
				return
			}
			// 这里重置键名,确保从0开始
			let index = 0;
			for (let item in json) {
				this.arrMusic[index] = json[item];
				index++;
			}
			this.arrMusicNum = this.arrMusic.length;
			this.playOrder();
			this.attrMusic(this.arrMusic[this.nowPlayNum])
		};
		// 切换歌曲
		this.attrMusic = function (arr, callback) {
			if (arr && arr.hasOwnProperty('url')) {
				this.audio.src = arr['url'];
				this.audio.load(); // 开始加载
				this.currentTime = this.audio.currentTime;
				this.createLrc(arr['lyc']);
				this.currentnum = 0;
				if (typeof this.switchCallback === "function") {
					this.switchCallback(arr)
				}
			}
		};
		// 创建歌词
		this.createLrc = function (lycText) {
			this.lycArray = new Array();
			if (!lycText) return;
			let lycs = new Array();
			let medises = lycText.split("\n");
			for (let i = 0; i < medises.length; i++) {
				let item = medises[i];
				let t = item.substring(item.indexOf("[") + 1, item.indexOf("]"));
				this.lycArray.push({
					t: (t.split(":")[0] * 60 + parseFloat(t.split(":")[1])).toFixed(3),
					c: item.substring(item.indexOf("]") + 1, item.length)
				})
			}
		};
		// 开始播放
		this.autoPlay = function (callback) {
			this.playStatus = 1;
			this.audio.play();
			if (typeof callback === "function") {
				callback()
			}
		};
		// 暂停播放
		this.stopPlay = function (callback) {
			this.playStatus = 0;
			this.audio.pause();
			if (typeof callback === "function") {
				callback()
			}
		};
		// 上一首
		this.prevMusic = function (callback) {
			this.operation = 'minus';
			let order = this.playOrder();
			if (order === 0) {
				this.nowPlayNum--
			} else {
				this.nowPlayNum = order
			}
			if (this.nowPlayNum < 0) {
				this.nowPlayNum = this.arrMusicNum - 1
			}
			this.attrMusic(this.arrMusic[this.nowPlayNum]);
			if (typeof callback === "function") {
				callback(this.arrMusic[this.nowPlayNum])
			}
			if (this.playStatus == 1) {
				this.audio.play()
			}
		};
		// 下一首
		this.nextMusic = function (callback) {
			this.operation = 'add';
			let order = this.playOrder();
			if (order === 0) {
				this.nowPlayNum++;
			} else {
				this.nowPlayNum = order;
			}
			if (this.nowPlayNum > this.arrMusicNum) {
				this.nowPlayNum = 0
			}
			this.attrMusic(this.arrMusic[this.nowPlayNum]);
			if (typeof callback === "function") {
				callback(this.arrMusic[this.nowPlayNum])
			}
			if (this.playStatus == 1) {
				this.audio.play()
			}
		};
		// 进度设置
		this.playProgress = function (val) {
			if (that.audio.duration && val) {
				that.audio.currentTime = Math.round(that.audio.duration * (val / 100));
				that._timeCallback();
			}
		};
		// 音量设置
		this.playVolume = function (volume, callback) {
			volume = volume > 1 ? 1 : volume;
			this.audio.volume = volume;
			if (typeof callback === "function") {
				callback(volume)
			}
		};
		// 速度设置
		this.playRate = function (val, callback) {
			val = val / 100;
			this.audio.playbackRate = val;
			if (typeof callback === "function") {
				callback(val)
			}
		};
		this.setTimes = function (value) {
			let theTime = parseInt(value);
			let theTime1 = 0;
			let theTime2 = 0;
			if (theTime > 60) {
				theTime1 = parseInt(theTime / 60);
				theTime = parseInt(theTime % 60);
				if (theTime1 > 60) {
					theTime2 = parseInt(theTime1 / 60);
					theTime1 = parseInt(theTime1 % 60)
				}
			};
			let theTime_y = parseInt(theTime);
			if (theTime_y < 10) {
				theTime_y = '0' + theTime_y
			}
			let results = "" + theTime_y;
			if (theTime1 > 0 || theTime1 == 0) {
				let theTime1_y = parseInt(theTime1);
				if (theTime1_y < 10) {
					theTime1_y = '0' + theTime1_y
				}
				results = "" + theTime1_y + ":" + results
			}
			if (theTime2 > 0 || theTime2 == 0) {
				let theTime2_y = parseInt(theTime2);
				if (theTime2_y < 10) {
					theTime2_y = '0' + theTime2_y
				}
				results = "" + theTime2_y + ":" + results
			}
			return results
		}
	}
	return mjs;
});