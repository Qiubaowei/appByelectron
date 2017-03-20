/**
 * Created by xaj on 2016/12/27.
 */
/*根据校验值检查回复信息*/
function checkRep(data) {
    var num = 0;
    //console.log(data.length)
    var l = data.length;

    for (var i = 0; i < l-2; i++)
    {
        num += data[i];
    }
    //console.error('检查回复信息， num： ' + num);

    var dataCheck = data.slice(l - 2, l);
    var checkNum  = dataCheck.readIntBE(0, 2);
    // var dataHex  = new Buffer(data).toString('hex');
    // var checkNum = parseInt(dataHex.slice(-4), 16);
    //console.error('检查回复校验信息， checkNum： ' + checkNum);

    if (num == checkNum)
    {
        console.log("校验成功！");
        return 1;
    }
    else
    {
        console.log("校验失败！");
        return 0;
    }

}

/*转化*/
function calDataNum(dataNum) {

    var dataOrder = new Buffer(2);

    dataOrder.writeUIntBE(dataNum,0,2);

    return dataOrder
    // var dataNumHex = dataNum.toString(16);
    // //console.log(dataNum.toString(16));
    //
    // if (dataNumHex.length < 3)
    // {
    //     var fir = 0x00;
    // }
    // if (dataNumHex.length == 3)
    // {
    //     var fir = dataNumHex.substr(0,1);
    //     //console.error(fir);
    //     fir = 0x0 + fir;
    // }
    // if (dataNumHex.length == 4)
    // {
    //     var fir = dataNumHex.substr(0,2);
    //     //console.error(fir);
    //     fir = '0x' + fir;
    // }
    //
    // console.log(new Buffer([fir, dataNum]));
    // return new Buffer([fir, dataNum]);
}

/*计算帧尾校验值*/
function calTileCheck(buf) {
    var len = 0;
    for (var i = 0, l = buf.length; i < l; i++)
    {
        len += buf[i];
    }
    return len;
}

var head1      = 0xFF;
var head2_up   = 0xAA;
var head2_down = 0XCC;

/*打包函数*/
function zip(updown,buf) {
    var order = 0; //帧序 1-255
    if ('up' == updown)
    {
        var head = new Buffer([head1,head2_up,order,buf.length]);
    }
    if ('down' == updown)
    {
        var head = new Buffer([head1,head2_down,order,buf.length]);
    }
    var headAndBody = bufferConcat(head, buf);
    var frame = bufferConcat(headAndBody, calDataNum(calTileCheck(headAndBody)));

    return frame;
}
/*打包can函数*/
function zipCan(buf) {
    var order = 0; //帧序 1-255
    var head = new Buffer([0xFF,0xCC,order,buf.length + 1,0xEE]);
    var headAndBody = bufferConcat(head, buf);
    var frame = bufferConcat(headAndBody, calDataNum(calTileCheck(headAndBody)));
    return frame;
}
/*解压CAN*/
function unCompressCan(data) {
    var num = 0;
    //console.log(data.length)
    var l = data.length;

    for (var i = 2; i < l-3; i++)
    {
        num += data[i];
    }
    //console.error('检查回复信息， num： ' + num);

    var dataOrder = new Buffer(2);
    dataOrder.writeUIntBE(num,0,2);
    // console.log(dataOrder.slice(1, 2))
    // var astr = dataOrder.toString('hex');
    // astr = (0 == astr[0]) ? astr.slice(1,3):astr.slice(0,2)
    // console.log(astr)

    var dataCheck = data.slice(l-3, l-2);
    // console.log(dataCheck)
    // var checkNum = Number(dataCheck.toString('hex'));
    // console.log(checkNum)
    //var checkNum  = dataCheck.readIntBE(0, 2);
    // var dataHex  = new Buffer(data).toString('hex');
    // var checkNum = parseInt(dataHex.slice(-4), 16);
    //console.error('检查回复校验信息， checkNum： ' + checkNum);

    if (dataOrder.slice(1, 2)[0] === dataCheck[0])
    {
        console.log("校验成功！");
        var res = {
            isSuccess: true,
            buffer: data.slice(2,14)
        };
        return res;
    }
    else
    {
        console.log("校验失败！");
        return 0;
    }
}


/*解压*/
function unCompress(buf) {
    for (var i = 0, l = buf.length; i < l; i++)
    {
        if (head1 == buf[i])
        {
            if (head2_up == buf[i+1] )
                var updown = "up";
            if (head2_down == buf[i+1] )
                var updown = "down";
            if (256 > buf[i+2])
            {
                var buffer = buf.slice(i,i+4+buf[i+3]+2);
                //console.log(buffer)
                var check = checkRep(buffer);
                if (1 == check)
                {
                    var res = {
                        updown: updown,
                        buffer: buffer
                    };
                    return res;
                }
                else if (0 == check)
                {
                    var res = buffer[4];
                    return res;
                }
            }
        }
    }
}


/*buffer拼接*/
function bufferConcat() {
    var array = [];
    var len = 0;
    if (0 == arguments.length)
    {
        return Buffer.concat(array, len);
    }
    else
    {
        for (var i = 0, l = arguments.length; i < l; i++)
        {
            if (undefined != arguments[i])
            {
                array.push(arguments[i]);
                len += arguments[i].length;
            }
        }
        return Buffer.concat(array, len);
    }

}


/*数据分割函数*/
function bufferSlice(buffer) {
    var byte = 128;  //分割大小
    var len = Math.ceil(buffer.length/byte);
    var res = [];
    for (var i = 0; i < len; i++)
    {
        res[i] = buffer.slice(byte*i, byte*(i+1));
    }
    return res;
}

/*获取文件类型*/
function getFileType(filepath) {

    var suffix = filepath.substr(-3);
    switch (suffix)
    {
        case "bin":
            var file_type_bin = 0x01;
            return file_type_bin;
            break;
        case "boot":
            var file_type_boot = 0x02;
            return file_type_boot;
            break;
        case "rmf":
            var file_type_rfm = 0x03;
            return file_type_rfm;
            break;
        case "mp3":
            var file_type_mp3 = 0x04;
            return file_type_mp3;
            break;
        default:
            return 0;
            break;
    }

}


exports.zip = zip;
exports.zipCan = zipCan;
exports.calDataNum = calDataNum;
exports.bufferSlice = bufferSlice;
exports.bufferConcat = bufferConcat;
exports.checkRep = checkRep;
exports.unCompress = unCompress;
exports.unCompressCan = unCompressCan;
exports.getFileType = getFileType;