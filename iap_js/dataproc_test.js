/**
 * Created by xaj on 2016/12/27.
 */
var fs   = require('fs');
var path = require('path');

var zip          = require('./lib').zip;
var calDataNum   = require('./lib').calDataNum;
var bufferSlice  = require('./lib').bufferSlice;
var bufferConcat = require('./lib').bufferConcat;

// var progress      = document.getElementById('progress');
// var progress_bin  = document.getElementById('progress_bin');
// var progress_rmf  = document.getElementById('progress_rmf');
// var RadioGroup1_0 = document.getElementById('RadioGroup1_0');
// var RadioGroup2_0 = document.getElementById('RadioGroup2_0');

//*********************************up***************************************************


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


//*********************************down********************************************************


//写入文件 下载文件到软件
function writeFile(buf) {
    fs.writeFile(path.join(__dirname, new Date().getHours() + ".log"), buf, function (err) {
        if (err) throw err;
        console.log("Write Success!");
    });
}
function appendFile() {
    fs.appendFile(path.join(__dirname, "vcu_" + new Date().getHours() + "-" + new Date().getMinutes() + ".log"), fileStrVcu, function(err){
        if (err) throw err;
        console.log("Append vcu log Success!");
        fileStrVcu = null;
    });
    fs.appendFile(path.join(__dirname, "tbox_" + new Date().getHours() + "-" + new Date().getMinutes() + ".log"), fileStrTbox, function(err){
        if (err) throw err;
        console.log("Append tbox log Success!");
        fileStrTbox = null;
    });
}

Date.prototype.format = function(format)
{
    var o = {
        "M+" : this.getMonth()+1, //month
        "d+" : this.getDate(),    //day
        "h+" : this.getHours(),   //hour
        "m+" : this.getMinutes(), //minute
        "s+" : this.getSeconds(), //second
        "q+" : Math.floor((this.getMonth()+3)/3),  //quarter
        "S" : this.getMilliseconds() //millisecond
    }
    if(/(y+)/.test(format)) format=format.replace(RegExp.$1,
        (this.getFullYear()+"").substr(4 - RegExp.$1.length));
    for(var k in o)if(new RegExp("("+ k +")").test(format))
        format = format.replace(RegExp.$1,
            RegExp.$1.length==1 ? o[k] :
                ("00"+ o[k]).substr((""+ o[k]).length));
    return format;
}

var type    = null;
var hasHead = false;
var rowVcu = 0;
var rowTbox = 0;
//*********************************receive_dataProcess**********************************************
function dataProcess(buff)
{
    var musicBluetooth = {0x00: "未连接", 0x01: "已连接", 0xFF: "模块未回应"};
    var dataBluetooth  = {0x00: "未连接", 0x01: "已连接", 0x02: "MAC返回成功", 0xFF: "模块未回应"};
    var remoteControl  = {0x00: "未按下", 0x01: "锁车键", 0x02: "解锁键"};
    var fileStore      = {0x00: "写入失败"};
    var four85Status   = {0x00: "通信失败", 0x01: "通信成功"};

    var GPSStatus  = {0x00: "通信失败", 0x01: "通信成功"};
    var GSMStatus  = {0x00: "通信失败", 0x01: "通信成功"};
    var SIMStatus  = {0x00: "未插入", 0x01: "已插入"};
    var gyroscope  = {0x00: "通信失败"};

    // var TableVCU = document.getElementById("vcu");   //取得自定义的VCU表对象
    // var NewRowVCU = TableVCU.insertRow();
    // var TableTBOX = document.getElementById("tbox");   //取得自定义的VCU表对象
    // var NewRowTBOX = TableTBOX.insertRow();

    var dev = buff.slice(0,4);
    var buff_t = buff.slice(4,13);
    console.log(dev)
    console.log(buff_t)

    // var tableHead = ['序号','时间','音频蓝牙','数据蓝牙','遥控器','文件存储状态','485通信状态','预留','发生事件的id'];
    var arr = [];
    var arrLost = [];
    if ((dev[0] == 0x33) && (dev[1] == 0x22) && (dev[2] == 0x11) && (dev[3] == 0x00))
    {
        type = "vcu";
        rowVcu++;

        if ((1 == buff_t[0] - orderVcu) || (-255 == buff_t[0] - orderVcu) || (orderVcu == null))
        {
            orderVcu = buff_t[0];
        }
        else
        {
            arrLost[0] = (buff_t[0]-1)<0?0:(buff_t[0]-1);
            arrLost[1] = new Date().format("hh:mm:ss");
            arrLost[2] = "数据丢失";
            arrLost[3] = "数据丢失";
            arrLost[4] = "数据丢失";
            arrLost[5] = "数据丢失";
            arrLost[6] = "数据丢失";
            arrLost[7] = "数据丢失";
            arrLost[8] = "数据丢失";
            addLost(type, arrLost);
            orderVcu = buff_t[0];
        }
        arr[0] = buff_t[0];
        arr[1] = new Date().format("hh:mm:ss");
        arr[2] = musicBluetooth[buff_t[1]];
        arr[3] = dataBluetooth[buff_t[2]];
        arr[4] = remoteControl[buff_t[3]];
        arr[5] = buff_t[4] == 0x00?fileStore[buff_t[4]]:buff_t[4];
        arr[6] = four85Status[buff_t[5]];
        arr[7] = buff_t[6];
        arr[8] = buff_t[7];

        // tableHead = ['序号','时间','音频蓝牙','数据蓝牙','遥控器','文件存储状态','485通信状态','预留','发生事件的id'];
        var strArr = arr.join("  ");
        var strY = buff_t.join("-");
        if (arrLost.length != 0)
        {
            var strL = arrLost.join("-") + "\n";
            fileStrVcu += strL + strArr + "  ("+ strY + ")"+ "\n";
        }
        else
        {
            fileStrVcu += strArr + "  ("+ strY + ")"+ "\n";
        }
    }
    if ((dev[0] == 0xff) && (dev[1] == 0x07) && (dev[2] == 0x00) && (dev[3] == 0x00))
    {
        type = "tbox";
        rowTbox++;

        if ((1 == buff_t[0] - orderTbox) || (-255 == buff_t[0] - orderTbox) || (orderTbox == null))
        {
            orderTbox = buff_t[0];
        }
        else
        {
            arrLost[0] = (buff_t[0]-1)<0?0:(buff_t[0]-1);
            arrLost[1] = new Date().format("hh:mm:ss");
            arrLost[2] = "数据丢失";
            arrLost[3] = "数据丢失";
            arrLost[4] = "数据丢失";
            arrLost[5] = "数据丢失";
            arrLost[6] = "数据丢失";
            arrLost[7] = "数据丢失";
            arrLost[8] = "数据丢失";
            addLost(type, arrLost);
            orderTbox = buff_t[0];
        }
        arr[0] = buff_t[0];
        arr[1] = new Date().format("hh:mm:ss");
        arr[2] = GPSStatus[buff_t[1]];
        arr[3] = GSMStatus[buff_t[2]];
        arr[4] = SIMStatus[buff_t[3]];
        arr[5] = buff_t[4] == 0x00?gyroscope[buff_t[4]]:buff_t[4];
        arr[6] = (buff_t[5]*6.6/255).toFixed(2);
        arr[7] = (buff_t[6]/2.5).toFixed(2);
        arr[8] = buff_t[7];

        // tableHead = ['序号','时间','GPS状态','GSM状态','SIM卡状态','陀螺仪角度','内部电池电压','主电池电压','预留'];
        var strArr = arr.join("  ");
        var strY = buff_t.join("-");
        if (arrLost.length != 0)
        {
            var strL = arrLost.join("-") + "\n";
            fileStrTbox += strL + strArr + "  ("+ strY + ")"+ "\n";
        }
        else
        {
            fileStrTbox += strArr + "  ("+ strY + ")"+ "\n";
        }
    }

    // if(false == hasHead)
    // {
    //     hasHead = true;
    //     var strHead = tableHead.join(" ");
    //     fileStr = strHead + "\n";
    //     // writeFile(strHead + "\n");
    // }

    if (5 == rowVcu)
    {
        deleteRow("vcu");
        rowVcu = 0;
    }
    if (5 == rowTbox)
    {
        deleteRow("tbox");
        rowTbox = 0;
    }

    // appendFile(strArr + "\n");
    render(type, arr, buff_t)
    console.log(arr)
}

/*列表只显示7行*/
function deleteRow(type) {
    var Table = document.getElementById(type);   //取得自定义的VCU表对象
    var rowNum = Table.rows.length;
    for (var i = 1; i < rowNum; i++)
    {
        Table.deleteRow(i);
        rowNum = rowNum-1;
        i = i - 1;
    }
}

function addLost(type, arrLost) {
    var Table = document.getElementById(type);   //取得自定义的表对象 vcu表或tbox表
    var NewRow = Table.insertRow();

    for (var i = 0, l = arrLost.length; i < l; i++)
    {
        var str = "<td>" + arrLost[i] + "</td>"
        NewRow.insertCell(i).innerHTML = str;
        NewRow.childNodes[i].style.color = "red"
    }
}
/*列表添加行*/
function render(type, arr, buff_t) {
    var Table = document.getElementById(type);   //取得自定义的表对象 vcu表或tbox表
    var NewRow = Table.insertRow();

    for (var i = 0, l = arr.length; i < l; i++)
    {
        var str = "<td>" + arr[i] + "</td>"
        NewRow.insertCell(i).innerHTML = str;

        if ((type == "vcu") && (i > 1) && (i < 4) && (buff_t[i-1] == 0xFF))
        {
            NewRow.childNodes[i].style.color = "red"
        }
        if ((type == "vcu") && (i > 3) && (i < 5) && (buff_t[i-1] == 0x00))
        {
            NewRow.childNodes[i].style.color = "red"
        }
        if((type == "tbox") && (i > 1) && (i < 5) && (buff_t[i-1] == 0x00))
        {
            NewRow.childNodes[i].style.color = "red"
        }
        if((type == "tbox") && (i == 6) && (3.6 > buff_t[5]*6.6/255 ))
        {
            NewRow.childNodes[i].style.color = "red"
        }
        if((type == "tbox") && (i == 7) && (28 > buff_t[6]/2.5 ))
        {
            NewRow.childNodes[i].style.color = "red"
        }
    }

}

exports.dataProcess  = dataProcess;
exports.readFileData = readFileData;
exports.getFileData  = getFileData;
exports.appendFile   = appendFile;