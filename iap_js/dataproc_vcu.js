/**
 * Created by xaj on 2016/12/27.
 */
var fs   = require('fs');
var path = require('path');

var zip          = require('./lib').zip;
var calDataNum   = require('./lib').calDataNum;
var bufferSlice  = require('./lib').bufferSlice;
var bufferConcat = require('./lib').bufferConcat;
var checkRep     = require('./lib').checkRep;
var unCompress   = require('./lib').unCompress;

var progress      = document.getElementById('progress');
var progress_bin  = document.getElementById('progress_bin');
var progress_rmf  = document.getElementById('progress_rmf');
var RadioGroup1_0 = document.getElementById('RadioGroup1_0');
var RadioGroup2_0 = document.getElementById('RadioGroup2_0');

var sendFile    = "温柔女生.rmf";
var receiveFile = "music_j_receive.rmf";

var nbr_fileData  = 0;//数据序
var trySendNumber = 0;//重发次数

var nbr_testCmd  = 0;//测试序列

var BUFSLICE  = null;
var BUFFERREC = null;

var sj_cmd                 = 0x01;

var ack_create_File_cmd    = 0x21;
var ack_write_File_cmd     = 0x22;
var ack_confirm_File_cmd   = 0x23;
var ack_restart_system_cmd = 0x24;
var ack_read_ver_cmd       = 0x25;


var create_File_cmd    = 0x01;
var write_File_cmd     = 0x02;
var confirm_File_cmd   = 0x03;
var restart_system_cmd = 0x04;
var read_ver_cmd       = 0x05;

var test1_cmd = 0xF1;
var test2_cmd = 0xF2;
var test3_cmd = 0xF3;
var test4_cmd = 0xF4;
var test5_cmd = 0xF5;
var testScan1_cmd = 0xFA;
var testScan2_cmd = 0xFB;
var ack_test1_cmd = 0x1F;
var ack_test2_cmd = 0x2F;
var ack_testScan1_cmd = 0xAF;
var ack_testScan2_cmd = 0xBF;

//create_File_cmd_Frame   在 getCmdFrame() 函数中从 getFileType() 函数中获取
//write_File_cmd_Frame   在 getCmdFrame() 函数中从 getFileData() 函数从文件中获取
var confirm_File_cmd_Frame   = new Buffer([sj_cmd, confirm_File_cmd]);
var restart_system_cmd_Frame = new Buffer([sj_cmd, restart_system_cmd]);
var read_ver_cmd_Frame       = new Buffer([sj_cmd, read_ver_cmd]);


var ack_create_File_cmd_Frame    = new Buffer([sj_cmd, ack_create_File_cmd, 1]);
var ack_write_File_cmd_Frame     = new Buffer([sj_cmd, ack_write_File_cmd, 1]);
var ack_confirm_File_cmd_Frame   = new Buffer([sj_cmd, ack_confirm_File_cmd, 1]);
var ack_restart_system_cmd_Frame = new Buffer([sj_cmd, ack_restart_system_cmd, 1]);
var ack_read_ver_cmd_Frame       = new Buffer([sj_cmd, ack_read_ver_cmd, 1]);


var ack_test1_cmd_Frame       = new Buffer([sj_cmd, ack_test1_cmd, 1]);
var ack_test2_cmd_Frame       = new Buffer([sj_cmd, ack_test2_cmd, 1]);



//*********************************up***************************************************

function getCmdFrame(cmd)
{
    switch (cmd)
    {
        case create_File_cmd:
            var targetObject = 0x01;
            return new Buffer([sj_cmd, create_File_cmd, targetObject, suffix]);
            break;
        case write_File_cmd:
            return getFileData();
            break;
        case confirm_File_cmd:
            return confirm_File_cmd_Frame;
            break;
        case restart_system_cmd:
            return restart_system_cmd_Frame;
            break;
        case read_ver_cmd:
            return read_ver_cmd_Frame;
            break;

        //自动化测试
        case test1_cmd:
            return new Buffer([sj_cmd, test1_cmd]);
            break;
        case test2_cmd:
            return new Buffer([sj_cmd, test2_cmd]);;
            break;
        case test3_cmd:
            return new Buffer([sj_cmd, test3_cmd]);;
            break;
        case test4_cmd:
            return new Buffer([sj_cmd, test4_cmd]);;
            break;
        case test5_cmd:
            return new Buffer([sj_cmd, test5_cmd]);;
            break;
        case testScan1_cmd:
            return scanData.slice(0, 3);
            break;
        case testScan2_cmd:
            return scanData.slice(3, scanData.length);
            break;
    }
}


var len = 0;
function readFileData(filePath)
{      
	BUFSLICE = bufferSlice(readFile(filePath));
	len      = BUFSLICE.length;
}


function getFileData() {
    var buf = {};
    buf.order = nbr_fileData;
    buf.data  = BUFSLICE[nbr_fileData];

    var frameCmd          = new Buffer([sj_cmd, write_File_cmd]);
    var frameContentOrder = calDataNum(buf.order);
    var frameBody         = bufferConcat(frameCmd, frameContentOrder, buf.data);

    ////console.error(frame);
	if(nbr_fileData == len)
	{
		nbr_fileData = 0;
		BUFSLICE     = null;
		return 0;
	}
	else
	{
		return frameBody;
	}
}

function getTestCmd() {
    var testBuf = [
        new Buffer([sj_cmd, test1_cmd]),
        new Buffer([sj_cmd, test2_cmd])
    ];

    return testBuf[nbr_testCmd]
}


//*********************************down********************************************************

/*读取文件*/
function readFile(filePath) {
    var realPath = path.join(__dirname, path.basename(filePath));
    var readData = fs.readFileSync(realPath);
    //console.log(readData);
    //console.log(readData.length);
    return readData;
}

//写入文件 下载文件到软件
function writeFile(buf) {
    fs.writeFile(path.join(__dirname, new Date().getSeconds() + receiveFile), buf, function (err) {
        if (err) throw err;
        console.log("Write Success!");
    });
}


function reSend(ack_cmd) {
    var response;
    var log;
    switch (ack_cmd)
    {
        case ack_create_File_cmd:
            log      = "创建对应文件失败！需要重新发送0x01命令，第 %d 次重发";
            response = getCmdFrame(create_File_cmd);
            break;
        case ack_write_File_cmd:
            log      = "写入一段数据失败！需要重新发送 上一条数据，第 %d 次重发";
            response = getFileData();
            break;
        case ack_confirm_File_cmd:
            log      = "确认文件失败！需要重新发送 0x03命令，第 %d 次重发";
            response = getCmdFrame(confirm_File_cmd);
            break;
        case ack_restart_system_cmd:
            log      = "重启失败！需要重新发送 0x04命令，第 %d 次重发";
            response = getCmdFrame(restart_system_cmd);
            break;
        case ack_read_ver_cmd:
            log      = "读取版本失败！需要重新发送 0x05命令，第 %d 次重发";
            response = getCmdFrame(read_ver_cmd);
            break;
    }
    trySendNumber++;
    if(3 > trySendNumber)
    {
        console.error(log, trySendNumber);
        return response;
    }
    else
    {
        //progress.innerHTML = "写入数据....................0%";
        console.error('已重发 %d 次，退出', trySendNumber);
        trySendNumber = 0;
        nbr_fileData  = 0;
        BUFSLICE      = null;
        emitter.emit("re_connect");
    }
}

var start = null;
//*********************************receive_dataProcess**********************************************
function dataProcess(buff_t)
{
    var cmd        = buff_t.buffer[5];
    var is_success = buff_t.buffer[6];
    var upDown     = buff_t.updown;
    if (buff_t.buffer && (upDown == "up"))
    {
		 //console.log('-------收到响应消息--------');
	    switch (cmd)
        {
			/*
			var create_File_cmd         = 0x01:
			var write_File_cmd          = 0x02:
			var confirm_File_cmd        = 0x03:
			var restart_system_cmd      = 0x04:
			var read_ver_cmd            = 0x05:

			var ack_create_File_cmd     = 0x21:
			var ack_write_File_cmd      = 0x22:
			var ack_confirm_File_cmd    = 0x23:
			var ack_restart_system_cmd  = 0x24:
			var ack_read_ver_cmd        = 0x25:
			*/

            case ack_create_File_cmd:
                start = new Date().getTime();
                if (1 == is_success) //
				{
                    //console.log('创建对应文件成功！进行下一步，写入文件');
					return getCmdFrame(write_File_cmd);
                }
                else if (0 == is_success)
                {
                    return reSend(ack_create_File_cmd);
                }
                break;

            case ack_write_File_cmd:
                console.log('------nbr_fileData------ :   ' + nbr_fileData);
                if (1 == is_success)
                {
                    if (progress)
                    {
                        progress.innerHTML = "写入数据...................."  + parseInt(nbr_fileData*100/len) + "%";
                    }
                    if((0x01 == suffix) && progress_bin)
                    {
                        progress_bin.innerHTML = parseInt(nbr_fileData*100/len) + "%";
                    }
                    if((0x03 == suffix) && progress_rmf)
                    {
                        progress_rmf.innerHTML = parseInt(nbr_fileData*100/len) + "%";
                    }
                    //console.log('写入第 %d 段数据成功！进行下一步，继续写入文件或发送确认文件命令', nbr_fileData+1);
                    nbr_fileData++;
                    var res = getFileData();
                    if (res == 0)
                    {
                        if (progress)
                        {
                            progress.innerHTML = "写入数据....................100%";
                        }
                        if((0x01 == suffix) && progress_bin)
                        {
                            progress_bin.innerHTML = "100%";
                            progress_bin.setAttribute("class", "red-color span1");
                        }
                        if((0x03 == suffix) && progress_rmf)
                        {
                            progress_rmf.innerHTML = "100%";
                            progress_rmf.setAttribute("class", "red-color span1");
                            setTimeout(function () {
                                voltage.innerHTML = "失败";
                            }, 500);
                        }

                        return  getCmdFrame(confirm_File_cmd);
                    }
                    else
                    {
                        return res;
                    }
                }
                else if (0 == is_success)
                {
                    return reSend(ack_write_File_cmd);
                }
                break;

            case ack_confirm_File_cmd:
                if (1 == is_success)
                {
                    //console.log('----确认文件成功！进行下一步，更新---');
                    console.timeEnd('写入文件成功');
                    var end = new Date().getTime();
                    var needTime = (end - start)/1000;
                    alert('need time : ' + needTime + "ms");
                    if (0x01 == suffix)
                    {
                        return getCmdFrame(restart_system_cmd);
                    }
                    else if (0x03 == suffix)
                    {
                        console.log('reconnect');
                        //如果接收的文件是音乐文件，确认文件结束后直接发送测试命令
                        emitter.emit('send_event', getCmdFrame(test1_cmd))
                    }
                }
                else if (0 == is_success)
                {
                    return reSend(ack_confirm_File_cmd);
                }
                break;

            case ack_restart_system_cmd:
                if (1 == is_success)
                {
                    console.log('更新成功！结束升级流程');
                    return getCmdFrame(read_ver_cmd);
                }
                else if (0 == is_success)
                {
                    console.error('更新失败！需要重新发送confirm_File_cmd命令');
                    return reSend(ack_restart_system_cmd);
                }
                break;

            case ack_read_ver_cmd:
                if (1 == is_success)
                {
                    console.log('读取版本号成功');
                    console.log('*******更新过程结束********');

                    emitter.emit('connectAfterUpdate', true);
                    // return getCmdFrame(test1_cmd)
                    return 0;
                }
                else if (0 == is_success)
                {
                    //console.error('读取版本号失败！需要重新发送0x04命令')
                    return reSend(ack_read_ver_cmd);
                }
                break;

            /*升级固件或者下载音乐结束后进入测试步骤*/
            case ack_test1_cmd:
                var voltage        = document.getElementById('voltage');
                var electricity    = document.getElementById('electricity');
                var can            = document.getElementById('can');
                var four85         = document.getElementById('four85');
                var dataBluetooth  = document.getElementById('dataBluetooth');
                var musicBluetooth = document.getElementById('musicBluetooth');
                var arr = [voltage, electricity, can, four85, dataBluetooth, musicBluetooth];
                if (1 == is_success)
                {
                    console.log('test111111成功');
                    for (var i = 0; i < arr.length; i++)
                    {
                        arr[i].innerHTML = "正常";
                        arr[i].setAttribute("class", "red-color span1");
                    }
                    // RadioGroup1_0.checked = true;
                    // RadioGroup2_0.checked = true;
                    return getCmdFrame(test2_cmd);
                }
                else if (0 == is_success)
                {
                    console.error('test111111失败！测试结束');
                    for (var i = 0; i < arr.length; i++)
                    {
                        arr[i].innerHTML = "FAIL";
                        arr[i].setAttribute("class", "red-color span1");
                    }
                    return 0;
                }
                break;

            case ack_test2_cmd:
                var voice   = document.getElementById('voice');
                var input   = document.getElementById('input');
                var light   = document.getElementById('light');
                var breathe = document.getElementById('breathe');
                var arr = [voice, input, light, breathe];
                if (1 == is_success)
                {
                    global.term = "light";
                    console.log('test2222222成功');
                    for (var i = 0; i < arr.length; i++)
                    {
                        arr[i].innerHTML = "正常";
                        arr[i].setAttribute("class", "red-color span1");
                    }

                    return getCmdFrame(test3_cmd);
                }
                else if (0 == is_success)
                {
                    for (var i = 0; i < arr.length; i++)
                    {
                        arr[i].innerHTML = "FAIL";
                        arr[i].setAttribute("class", "red-color span1");
                    }
                    console.error('test2222222失败！测试结束');
                    return 0;
                }
                break;

            case ack_testScan1_cmd:
                return getCmdFrame(testScan2_cmd)
                break;

            default:
                //console.error('响应命令不匹配：' + buf[5]);
                break;
        }
    }
    else if (buff_t.buffer && (upDown == "down"))
    {
		/*
		var create_File_cmd              = 0x01:
		var write_File_cmd               = 0x02:
		var confirm_File_cmd             = 0x03:
		var restart_system_cmd           = 0x04:
		var read_ver_cmd                 = 0x05:

		var ack_create_File_cmd          = 0x21:
		var ack_write_File_cmd           = 0x22:
		var ack_confirm_File_cmd         = 0x23:
		var ack_restart_system_cmd       = 0x24:
		var ack_read_ver_cmd             = 0x25:

        var ack_create_File_cmd_Frame    = new Buffer([sj_cmd, ack_create_File_cmd]);
        var ack_write_File_cmd_Frame     = new Buffer([sj_cmd, ack_write_File_cmd]);
        var ack_confirm_File_cmd_Frame   = new Buffer([sj_cmd, ack_confirm_File_cmd]);
        var ack_restart_system_cmd_Frame = new Buffer([sj_cmd, ack_restart_system_cmd]);
        var ack_read_ver_cmd_Frame       = new Buffer([sj_cmd, ack_read_ver_cmd]);
        */
        switch (cmd)
        {
            case create_File_cmd:/*创建文件*/
                //console.log('收到创建文件命令');
                BUFFERREC = bufferConcat();
                return ack_create_File_cmd_Frame;

            case write_File_cmd:/*写入文件*/
                //console.log('收到写入文件命令');
                BUFFERREC = bufferConcat(BUFFERREC,buff_t.buffer.slice(8,buff_t.buffer.length-2));
                return ack_write_File_cmd_Frame;

            case confirm_File_cmd:/*确认文件*/
                //console.log('收到确认文件命令');
                writeFile(BUFFERREC);
                return ack_confirm_File_cmd_Frame;

            case restart_system_cmd:/*重启系统*/
                //console.log('收到重启系统命令');
                return ack_restart_system_cmd_Frame;

            case read_ver_cmd:/*读取版本号*/
                //console.log('收到读取版本号命令');
                return ack_read_ver_cmd_Frame;

            case test1_cmd:/*测试1*/
                //console.log('收到读取版本号命令');
                return ack_test1_cmd_Frame;

            case test2_cmd:/*测试1*/
                //console.log('收到读取版本号命令');
                return ack_test2_cmd_Frame;

            default:
                //console.error('命令字不匹配： ' + buf[5]);
        }
    }
    else
    {
        alert("error");
    }
}

exports.dataProcess  = dataProcess;
exports.getCmdFrame  = getCmdFrame;
exports.readFileData = readFileData;
exports.getFileData  = getFileData;