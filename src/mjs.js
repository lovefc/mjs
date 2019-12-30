/**
 * 基础的music播放js类库-mjs
 * 封装了基本的音乐操作
 * author: lovefc
 * git: https://gitee.com/lovefc/mjs
 * time: 2019/12/24 14:25
 * uptime: 2019/12/25 11:00
 */
'use strice';
let mjs = function () {
    if (!new.target) {
        return new mjs()
    };
    this.audio = '';
    this.playStatus = 0;
    this.allTime = 0;
    this.currentTime = 0;
    this.arrMusic = new Array();
    this.nowPlayNum = 0;
    this.arrMusicNum = 0;
    this.lycArray = new Array();
    this.onlyLoop = 0;
    this.volume = 1;
    this.currentnum = 0;
    this.order = 0;
    this.lycCallback = function () { };
    this.switchCallback = function () { };
    this.timeCallback = function () { };
    this.initCallback = function () { };
    this.init = function (data) {
        if (!data) return false;
        this.audio = document.createElement('audio');
        this.audio.crossOrigin = 'anonymous';
        this.audio.controls = false;
        this.audio.src = '';
        document.body.appendChild(this.audio);
        this.jsonToArray(data);
        let that = this;
        this.audio.addEventListener('ended', function () {
            if (that.playStatus == 1) {
                if (that.order != 2) {
                    that.nextMusic()
                } else {
                    that.autoPlay()
                }
            }
        }, false);
        let music_task = window.setInterval(function () {
            that.currentTime = that.audio.currentTime;
            if (!that.currentTime) {
                if (that.playStatus == 1) {
                    that.nextMusic()
                }
            }
        }, 3000);
        let music_currentnum = setInterval(function () {
            for (i = 0; i < that.lycArray.length; i++) {
                if (parseInt(that.lycArray[i].t) <= parseInt(that.currentTime + 0.1) && parseInt(that.lycArray[i + 1].t) >= parseInt(that.currentTime + 0.1)) {
                    that.currentnum = i
                }
            }
        }, 1000);
        if (typeof this.initCallback === "function") {
            this.initCallback(this.arrMusic[this.nowPlayNum])
        }
    };
    this.orderMusic = function (num) {
        this.order = +num
    };
    this.playOrder = function () {
        let num = this.order;
        let nowPlayNum = 0;
        switch (num) {
            case 1:
                nowPlayNum = parseInt(Math.random() * (this.arrMusicNum - 1 + 1) + 1, 10);
                this.nowPlayNum = nowPlayNum;
                break
        }
        return nowPlayNum
    };
    this.getAudio = function () {
        return this.audio
    };
    this.jsonToArray = function (json) {
        this.arrMusic = new Array();
        if (json == null && json.toString() == '') {
            console.log('json error');
            return
        }
        for (let item in json) {
            this.arrMusic[item] = json[item]
        }
        this.arrMusicNum = this.arrMusic.length;
        this.playOrder();
        this.attrMusic(this.arrMusic[this.nowPlayNum])
    };
    this.attrMusic = function (arr, callback) {
        if (arr && arr.hasOwnProperty('url')) {
            this.audio.src = arr['url'];
            this.audio.load();
            this.currentTime = this.audio.currentTime;
            this.createLrc(arr['lyc']);
            this.currentnum = 0;
            let that = this;

            function canplay(callback2) {
                that.audio.oncanplay = function () {
                    let allTime2 = that.audio.duration;
                    callback2(allTime2)
                }
            }
            canplay(function (time) {
                let allTime = time;
                that.allTime = allTime;
                that.audio.ontimeupdate = function () {
                    if (that.lycArray.length > 0) {
                        if (that.currentnum == that.lycArray.length - 1 && that.audio.currentTime.toFixed(3) >= parseFloat(that.lycArray[that.currentnum].t)) {
                            if (typeof that.lycCallback === "function") {
                                that.lycCallback(that.lycArray[that.currentnum].c)
                            }
                        }
                        if (parseInt(that.lycArray[that.currentnum].t) <= parseInt(that.audio.currentTime + 0.08) && parseInt(that.audio.currentTime + 0.08) <= parseInt(that.lycArray[that.currentnum + 1].t)) {
                            if (that.audio.currentTime > 0) {
                                if (typeof that.lycCallback === "function") {
                                    that.lycCallback(that.lycArray[that.currentnum].c)
                                }
                            }
                            that.currentnum++
                        }
                    }
                    if (allTime) {
                        that.currentTime = that.audio.currentTime;
                        let playProgress = Math.round(that.currentTime / allTime * 100);
                        if (typeof that.timeCallback === "function") {
                            let times = new Array();
                            times['nowtime'] = that.setTimes(Math.round(that.currentTime));
                            times['alltime'] = that.setTimes(Math.round(allTime));
                            times['progress'] = playProgress;
                            that.timeCallback(times)
                        }
                    }
                }
            });
            if (typeof this.switchCallback === "function") {
                this.switchCallback(arr)
            }
        }
    };
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
    this.autoPlay = function (callback) {
        this.playStatus = 1;
        this.audio.play();
        if (typeof callback === "function") {
            callback()
        }
    };
    this.stopPlay = function (callback) {
        this.playStatus = 0;
        this.audio.pause();
        if (typeof callback === "function") {
            callback()
        }
    };
    this.prevMusic = function (callback) {
        let order = this.playOrder();
        if (order === 0) {
            this.nowPlayNum--
        } else {
            this.nowPlayNum = order
        } if (this.nowPlayNum < 0) {
            this.nowPlayNum = this.arrMusicNum - 1
        }
        this.attrMusic(this.arrMusic[this.nowPlayNum]);
        if (typeof callback === "function") {
            callback(this.arrMusic[this.nowPlayNum])
        }
        if (this.playStatus = 1) {
            this.audio.play()
        }
    };
    this.nextMusic = function (callback) {
        let order = this.playOrder();
        if (order === 0) {
            this.nowPlayNum++
        } else {
            this.nowPlayNum = order
        } if (this.nowPlayNum > this.arrMusicNum) {
            this.nowPlayNum = 0
        }
        this.attrMusic(this.arrMusic[this.nowPlayNum]);
        if (typeof callback === "function") {
            callback(this.arrMusic[this.nowPlayNum])
        }
        if (this.playStatus = 1) {
            this.audio.play()
        }
    };
    this.playProgress = function (val, callback) {
        if (this.allTime && val) {
            this.audio.currentTime = Math.round(this.allTime * val / 100);
            if (typeof callback === "function") {
                callback(val)
            }
        }
    };
    this.playVolume = function (volume, callback) {
        volume = volume > 1 ? 1 : volume;
        this.audio.volume = volume;
        if (typeof callback === "function") {
            callback(volume)
        }
    };
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