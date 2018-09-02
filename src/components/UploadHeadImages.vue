<template>
  <div class="upload-img clear-fix">
    <div class="original-canvas">
      <canvas ref="originalCanvas" @mousedown.prevent="hasImgSrc ? pressDown(originalCtx, $event) : false" @mousemove="mouseDown ? moveMouse($event) : false" @mouseup="stopCut">
        您的浏览器不支持canvas，请升级最新版本
      </canvas>
      <p class="img-scale">
        图片压缩：
        <span v-text="Math.round(originalCanvasWidth) + ' * ' + Math.round(originalCanvasHeight)"></span>
      </p>
      <div v-if="hasImgSrc" class="control-btn">
        <button @click="chooseSize(cutSize)" class="min-btn" type="button">Min</button>
        <button @click="reduceSize" class="reduce-btn" type="button">-</button>
        <button @click="plusSize" class="plus-btn" type="button">+</button>
        <button @click="chooseSize(scaleSize)" class="max-btn" type="button">Max</button>
      </div>
      <div class="choose-img">
        选择图片
        <input type="file" @change="chooseImg($event)">
      </div>
    </div>
    <div v-show="hasImgSrc" class="cut-canvas">
      <canvas ref="cutCanvas"></canvas>
      <p class="img-scale">
        截图长度：
        <span v-text="Math.round(cutSize) + ' * ' + Math.round(cutSize)"></span>
      </p>
      <button @click="submitImg" type="button" class="upload-btn">上传头像</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'UploadHeadImages',
  data () {
    return {
      originalCanvas: null, // 原图 画布
      originalCtx: null, // 原图 上下文
      originalImg: null, // 原图片的对象
      cutCanvas: null, // 显示裁剪后图片的画布
      cutCtx: null, // 裁图 画布 上下文
      cutImg: null, // 裁剪后 图片的对象
      originalCanvasWidth: 0, // 原图 压缩后 宽度
      originalCanvasHeight: 0, // 原图 压缩后 高度
      scaleSize: 300, // 原图压缩的尺寸
      cutSize: 200, // 裁剪 正方形的宽高
      centerX: 0, // 原图画布中心 X坐标
      centerY: 0, // 原图画布中心 Y坐标
      mouseX: 0, // 鼠标所在点 X坐标
      mouseY: 0, // 鼠标所在点 Y坐标
      differenceX: 0, // 原点X - 鼠标X点 差值
      differenceY: 0, // 原点Y - 鼠标Y点 差值
      mouseDown: false, // 鼠标是否点击
      hasImgSrc: false, // 是否有可裁剪图片
      imageDate: null, // 截图 对象
      tempImageData: null, // 实时截图 缓存对象
      imgFormat: ['jpg', 'png'] // 图片上传格式
    }
  },
  methods: {
    // 鼠标点击事件
    pressDown (ctx, e) {
      // 鼠标 坐标
      this.mouseX = e.offsetX
      this.mouseY = e.offsetY
      // 原点到鼠标之间的差值
      this.differenceX = this.centerX - this.mouseX
      this.differenceY = this.centerY - this.mouseY
      // 截图框内才能拖动
      if (Math.abs(this.differenceX) <= this.cutSize / 2 && Math.abs(this.differenceY) <= this.cutSize / 2) {
        // 允许鼠标移动事件
        this.mouseDown = true
      }
    },
    // 鼠标移动事件
    moveMouse (e) {
      if (this.mouseDown) {
        // 清空 上个路径的截图框 X、Y坐标 - 1 宽高 + 2 彻底清除整个截图框区域
        this.originalCtx.clearRect(this.centerX - this.cutSize / 2 - 1, this.centerY - this.cutSize / 2 - 1, this.cutSize + 2, this.cutSize + 2)
        this.originalCtx.putImageData(this.tempImageData, this.centerX - this.cutSize / 2 - 1, this.centerY - this.cutSize / 2 - 1)
        // 重新赋值 截图框原点位置
        if (e.offsetX > this.cutSize / 2 - this.differenceX && e.offsetX + this.cutSize / 2 + this.differenceX < this.originalCanvas.width) {
          // 可移动范围内赋值
          this.centerX = e.offsetX + this.differenceX
        } else {
          // 不可移动范围内赋值
          this.centerX = e.offsetX <= this.cutSize / 2 - this.differenceX ? this.cutSize / 2 : this.originalCanvas.width - this.cutSize / 2
        }
        if (e.offsetY > this.cutSize / 2 - this.differenceY && e.offsetY + this.cutSize / 2 + this.differenceY < this.originalCanvas.height) {
          this.centerY = e.offsetY + this.differenceY
        } else {
          this.centerY = e.offsetY <= this.cutSize / 2 - this.differenceY ? this.cutSize / 2 : this.originalCanvas.height - this.cutSize / 2
        }
        // 缓存 截图对象
        this.imageData = this.originalCtx.getImageData(this.centerX - this.cutSize / 2, this.centerY - this.cutSize / 2, this.cutSize, this.cutSize)
        // 缓存 清除截图框的 绘图模块
        this.tempImageData = this.originalCtx.getImageData(this.centerX - this.cutSize / 2 - 1, this.centerY - this.cutSize / 2 - 1, this.cutSize + 2, this.cutSize + 2)
        // 重绘截图框
        this.drawCuttingFrame(this.originalCtx, this.centerX, this.centerY, this.cutSize / 2, 20)
        // 绘制 裁剪图片
        this.drawCutImage(this.imageData)
      }
    },
    // 松开鼠标点击
    stopCut () {
      // 停止鼠标拖动事件
      this.mouseDown = false
    },
    // 选择图片
    chooseImg (e) {
      // 选中文件择执行
      if (e.target.files.length !== 0) {
        // 获取文件
        let file = e.target.files[0]
        // 限定上传格式
        let arr = this.imgFormat
        let str = file.name.split('.').pop()
        if (arr.indexOf(str) !== -1) {
          // 转换成Base 64位
          this.changeDataURL(file, (dataUrl) => {
            this.originalImg.src = dataUrl
            // 获取图片 宽高
            let width = this.originalImg.width
            let height = this.originalImg.height
            // 清除画布
            this.clearCanvas()
            // 重置画布的宽高
            let originalCanvas = this.originalCanvas
            originalCanvas.width = this.originalCanvasWidth = this.scaleSize
            originalCanvas.height = this.originalCanvasHeight = this.scaleSize
            // 设置画布压缩后的宽高
            if (width > height) {
              originalCanvas.width = this.originalCanvasWidth = width * this.scaleSize / height
            } else if (width < height) {
              originalCanvas.height = this.originalCanvasHeight = height * this.scaleSize / width
            }
            // 设置绘图原点
            this.centerX = Math.round(originalCanvas.width / 2)
            this.centerY = Math.round(originalCanvas.height / 2)
            // 图片加载完成 绘制选中的图片
            this.originalImg.onload = () => {
              // 允许鼠标点击事件
              this.hasImgSrc = true
              // 绘制图片
              this.drawOriginal(this.originalImg, originalCanvas.width, originalCanvas.height)
            }
          })
        } else {
          alert('图片格式错误')
        }
      }
    },
    // 转换成dataUrl
    changeDataURL (fileObj, callback) {
      let file = new FileReader()
      file.readAsDataURL(fileObj)
      file.onload = (e) => { callback(e.target.result) }
    },
    // 尺寸减1 重绘
    reduceSize () {
      // 不能小于裁剪大小
      if (this.originalCanvasWidth > this.cutSize && this.originalCanvasHeight > this.cutSize) {
        // 清除画布
        this.clearCanvas()
        // 固定短边，计算长边的值
        if (this.originalCanvasWidth > this.originalCanvasHeight) {
          this.originalCanvas.height = this.originalCanvasHeight -= 1
          this.originalCanvas.width = this.originalCanvasWidth = this.originalCanvasHeight / (this.originalCanvasHeight + 1) * this.originalCanvasWidth
        } else if (this.originalCanvasWidth < this.originalCanvasHeight) {
          this.originalCanvas.width = this.originalCanvasWidth -= 1
          this.originalCanvas.height = this.originalCanvasHeight = this.originalCanvasWidth / (this.originalCanvasWidth + 1) * this.originalCanvasHeight
        } else {
          this.originalCanvas.width = this.originalCanvasWidth -= 1
          this.originalCanvas.height = this.originalCanvasHeight -= 1
        }
        // 设置绘图原点
        this.centerX = Math.round(this.originalCanvas.width / 2)
        this.centerY = Math.round(this.originalCanvas.height / 2)
        // 绘制 原图 截图框
        this.drawOriginal(this.originalImg, this.originalCanvasWidth, this.originalCanvasHeight)
      }
    },
    // 尺寸加1 重绘
    plusSize () {
      if (!(this.originalCanvasWidth >= 300 && this.originalCanvasHeight >= 300)) {
        // 清除画布
        this.clearCanvas()
        // 计算长边的值
        if (this.originalCanvasWidth > this.originalCanvasHeight) {
          this.originalCanvas.height = this.originalCanvasHeight += 1
          this.originalCanvas.width = this.originalCanvasWidth = this.originalCanvasHeight / (this.originalCanvasHeight - 1) * this.originalCanvasWidth
        } else if (this.originalCanvasWidth < this.originalCanvasHeight) {
          this.originalCanvas.width = this.originalCanvasWidth += 1
          this.originalCanvas.height = this.originalCanvasHeight = this.originalCanvasWidth / (this.originalCanvasWidth - 1) * this.originalCanvasHeight
        } else {
          this.originalCanvas.width = this.originalCanvasWidth += 1
          this.originalCanvas.height = this.originalCanvasHeight += 1
        }
        // 设置绘图原点
        this.centerX = Math.round(this.originalCanvas.width / 2)
        this.centerY = Math.round(this.originalCanvas.height / 2)
        // 绘制 原图 截图框
        this.drawOriginal(this.originalImg, this.originalCanvasWidth, this.originalCanvasHeight)
      }
    },
    // 选择最大 最小 缩放比例 重绘
    chooseSize (size) {
      // 清除画布
      this.clearCanvas()
      // 计算长边的值
      let width = this.originalCanvasWidth
      let height = this.originalCanvasHeight
      let originalCanvas = this.originalCanvas
      if (width > height) {
        originalCanvas.width = this.originalCanvasWidth = size / height * width
        originalCanvas.height = this.originalCanvasHeight = size
      } else if (width < height) {
        originalCanvas.height = this.originalCanvasHeight = size / width * height
        originalCanvas.width = this.originalCanvasWidth = size
      } else {
        originalCanvas.width = this.originalCanvasWidth = size
        originalCanvas.height = this.originalCanvasHeight = size
      }
      // 设置绘图原点
      this.centerX = Math.round(originalCanvas.width / 2)
      this.centerY = Math.round(originalCanvas.height / 2)
      // 绘制 原图 截图框
      this.drawOriginal(this.originalImg, originalCanvas.width, originalCanvas.height)
    },
    // 清楚画布
    clearCanvas () {
      // 绘制原图片
      this.originalCtx.clearRect(0, 0, this.originalCanvasWidth, this.originalCanvasHeight)
    },
    // 绘制 压缩后的图片
    drawOriginal (img, width, height) {
      // 绘制 原图
      this.originalCtx.drawImage(img, 0, 0, width, height)
      // 缓存 截图对象
      this.imageData = this.originalCtx.getImageData(this.centerX - this.cutSize / 2, this.centerY - this.cutSize / 2, this.cutSize, this.cutSize)
      // 清除截图区域时使用
      this.tempImageData = this.originalCtx.getImageData(this.centerX - this.cutSize / 2 - 1, this.centerY - this.cutSize / 2 - 1, this.cutSize + 2, this.cutSize + 2)
      // 绘制 截图框
      this.drawCuttingFrame(this.originalCtx, this.centerX, this.centerY, this.cutSize / 2, 20)
      // 绘制 裁剪图片
      this.drawCutImage(this.imageData)
    },
    // 绘制 裁剪后的图片
    drawCutImage (imageData) {
      this.cutCtx.putImageData(imageData, 0, 0)
    },
    // 绘制截图框
    drawCuttingFrame (ctx, x, y, l, d) {
      ctx.beginPath()
      // 右上框
      ctx.moveTo(x - 1, y - l)
      ctx.lineTo(x + 1, y - l)
      ctx.moveTo(x + d, y - l)
      ctx.lineTo(x + l, y - l)
      ctx.lineTo(x + l, y - d)
      // 右下框
      ctx.moveTo(x + l, y - 1)
      ctx.lineTo(x + l, y + 1)
      ctx.moveTo(x + l, y + d)
      ctx.lineTo(x + l, y + l)
      ctx.lineTo(x + d, y + l)
      // 左下框
      ctx.moveTo(x - 1, y + l)
      ctx.lineTo(x + 1, y + l)
      ctx.moveTo(x - d, y + l)
      ctx.lineTo(x - l, y + l)
      ctx.lineTo(x - l, y + d)
      // 左上框
      ctx.moveTo(x - l, y - 1)
      ctx.lineTo(x - l, y + 1)
      ctx.moveTo(x - l, y - d)
      ctx.lineTo(x - l, y - l)
      ctx.lineTo(x - d, y - l)
      ctx.strokeStyle = 'green'
      ctx.stroke()
      ctx.closePath()
    },
    // 上传头像
    submitImg () {
      // 生成截图
      let dataUrl = this.cutCanvas.toDataURL('image/png')
      // 转换成 file 对象 headPic: 名称可自定义
      this.files = this.changeToFile(dataUrl, 'headPic')
      console.log(this.files)
    },
    // 转换成file对象
    changeToFile (dataUrl, fileName) {
      let arr = dataUrl.split(',')
      let mime = arr[0].match(/:(.*?);/)[1]
      let bStr = atob(arr[1])
      let n = bStr.length
      let u8arr = new Uint8Array(n)
      while (n--) {
        u8arr[n] = bStr.charCodeAt(n)
      }
      return new File([u8arr], fileName, {type: mime})
    }
  },
  mounted () {
    // 初始化 原图的画布
    let originalCanvas = this.originalCanvas = this.$refs.originalCanvas
    let originalCtx = this.originalCtx = originalCanvas.getContext('2d')
    // 初始化 裁图 画布
    let cutCanvas = this.cutCanvas = this.$refs.cutCanvas
    this.cutCtx = cutCanvas.getContext('2d')
    // 设置画布宽高
    originalCanvas.width = this.originalCanvasWidth = this.scaleSize
    originalCanvas.height = this.originalCanvasHeight = this.scaleSize
    cutCanvas.width = this.cutSize
    cutCanvas.height = this.cutSize
    // 绘制默认图片
    if (originalCanvas.getContext) {
      let originalImg = this.originalImg = new Image()
      originalImg.src = require('../assets/images/headImg/defineImg.png')
      originalImg.onload = () => {
        originalCtx.drawImage(originalImg, originalCanvas.width / 2 - this.cutSize / 2, originalCanvas.height / 2 - this.cutSize / 2, this.cutSize, this.cutSize)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
  .upload-img{
    display: table;
    text-align: center;
    padding-top: 50px;
    margin: 0 auto;
    .original-canvas{
      float: left;
      canvas{
        border: 1px solid #999;
      }
      .choose-img{
        width: 120px;
        height: 30px;
        line-height: 30px;
        font-size: 15px;
        color: #fff;
        text-align: center;
        background-color: #1869ff;
        -webkit-border-radius: 3px;
        -moz-border-radius: 3px;
        border-radius: 3px;
        margin: 20px auto;
        position: relative;
        &:hover{
          opacity: 0.9;
        }
        input{
          position: absolute;
          left: 0;
          top: 0;
          width: inherit;
          height: inherit;
          -webkit-border-radius: 3px;
          -moz-border-radius: 3px;
          border-radius: 3px;
          border: none;
          outline: none;
          opacity: 0;
          cursor: pointer;
          z-index: 99;
        }
      }
      .control-btn{
        button{
          color: #fff;
          background-color: #1869ff;
          border: none;
          outline: none;
          margin: 10px 5px;
          cursor: pointer;
          &:hover{
            opacity: 0.9;
          }
        }
        .min-btn, .max-btn{
          width: 50px;
          line-height: 2;
        }
        .plus-btn, .reduce-btn{
          width: 30px;
          line-height: 1.5;
        }
      }
    }
    .cut-canvas{
      float: left;
      width: 300px;
      height: 500px;
      .upload-btn{
        display: table;
        width: 120px;
        height: 30px;
        line-height: 30px;
        font-size: 15px;
        border: none;
        outline: none;
        background-color: #1869ff;
        color: #fff;
        -webkit-border-radius: 3px;
        -moz-border-radius: 3px;
        border-radius: 3px;
        cursor: pointer;
        margin: 20px auto;
        &:hover{
          opacity: 0.9;
        }
      }
    }
    .img-scale{
      width: 100%;
      line-height: 1.5;
      font-size: 12px;
      color: #e22347;
      text-align: center;
      margin: 0;
    }
  }
</style>
