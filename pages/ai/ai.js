// pages/ai/ai.js

Page({
  // 相机相关变量
  cameraContext: null,   // 相机上下文
  
  /**
   * 页面的初始数据
   */
  data: {
    cameraActive: false,
    cameraError: false,
    errorMsg: '',
    
    // 近视相关数据
    myopiaDegree: 100,           // 默认100度近视
    myopiaDiopter: '-1.00',      // 默认度数单位
    educationalTip: '',          // 教育提示
    blurValue: 3,                // CSS模糊值
    
    // 性能相关
    deviceCapabilities: {},      // 设备能力信息
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    this.checkDeviceCapabilities();
    this.updateEducationalTip(this.data.myopiaDegree);
    this.checkCameraPermission();
    
    // 将初始度数转换为模糊值
    const blurValue = this.myopiaDegreeToBlurPixels(this.data.myopiaDegree);
    this.setData({ blurValue: blurValue });
    
    console.log(`页面已加载，近视度数: ${this.data.myopiaDegree}度`);
  },
  
  // 检查设备能力
  checkDeviceCapabilities() {
    try {
      const info = wx.getSystemInfoSync();
      
      this.setData({
        deviceCapabilities: {
          benchmarkLevel: info.benchmarkLevel || 10,
          platform: info.platform,
          brand: info.brand,
          model: info.model,
          SDKVersion: info.SDKVersion
        }
      });
      
      // 根据设备性能调整渲染模式
      const { benchmarkLevel } = this.data.deviceCapabilities;
      this.setData({ 
        performanceMode: benchmarkLevel >= 20 ? 'high' : 'low'
      });
      
    } catch (error) {
      console.error('获取设备信息失败', error);
    }
  },
  
  // 近视度数到CSS像素模糊值的映射 - 更真实自然的方式
  myopiaDegreeToBlurPixels(degree) {
    if (degree <= 0) return 0;
    
    // 等比例模糊模型 - 降低整体模糊系数
    // 100度对应大约1.2px模糊
    // 300度对应大约2.5px模糊
    // 500度对应大约4px模糊
    let blurValue;
    
    if (degree < 100) {
      // 低度数近视，线性增长，非常轻微
      blurValue = degree * 0.012;
    } else if (degree < 300) {
      // 中度数近视，增长稍快
      blurValue = 1.2 + (degree - 100) * 0.0065;
    } else {
      // 高度近视，增长更快
      blurValue = 2.5 + (degree - 300) * 0.0075;
    }
    
    // 四舍五入到一位小数
    return Math.round(blurValue * 10) / 10;
  },
  
  // 更新教育提示
  updateEducationalTip(degree) {
    let tip = "";
    
    if (degree < 50) {
      tip = "正常视力，保持良好用眼习惯可以预防近视发生";
    } else if (degree < 200) {
      tip = "轻度近视，建议定期检查视力，控制用眼时间";
    } else if (degree < 400) {
      tip = "中度近视，应佩戴合适眼镜，每年检查眼底";
    } else {
      tip = "高度近视，有眼底病变风险，需严格控制用眼并定期复查";
    }
    
    this.setData({ educationalTip: tip });
  },
  
  // 检查相机权限
  checkCameraPermission() {
    wx.authorize({
      scope: 'scope.camera',
      success: () => {
        // 成功授权
        console.log('相机授权成功');
        this.setData({ cameraActive: true, cameraError: false, errorMsg: '' });
      },
      fail: () => {
        // 拒绝授权
        this.handleCameraError('用户拒绝相机权限');
      }
    });
  },
  
  /**
   * 生命周期函数--页面隐藏
   */
  onHide() {
    // 当页面隐藏时不需要特殊处理
  },
  
  /**
   * 生命周期函数--页面卸载
   */
  onUnload() {
    // 卸载时清理相机资源
    this.cameraContext = null;
  },
  
  /**
   * 生命周期函数--页面显示
   */
  onShow() {
    // 如果之前有错误，尝试重新获取权限
    if (this.data.cameraError) {
      this.checkCameraPermission();
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    if (!this.data.cameraActive) return;
    
    try {
      // 初始化相机上下文
      this.cameraContext = wx.createCameraContext(this);
      if (!this.cameraContext) {
        this.handleCameraError('不支持相机功能');
        return;
      }
      
      console.log('相机已就绪，使用CSS模糊效果已生效');
      
    } catch (error) {
      console.error('创建相机上下文失败:', error);
      this.handleCameraError('相机初始化失败');
    }
  },
  

  
  /**
   * 处理相机错误
   */
  handleCameraError(msg) {
    this.setData({
      cameraActive: false,
      cameraError: true,
      errorMsg: msg || '相机不可用'
    });
  },

  /**
   * 用户交互 - 度数变化
   */
  onDegreeChange(e) {
    const degree = e.detail.value;
    this.setData({
      myopiaDegree: degree,
      myopiaDiopter: this.formatDiopter(degree)
    });
    
    // 更新教育提示
    this.updateEducationalTip(degree);
  },
  
  // 将度数转换为屏幕显示的度数格式
  formatDiopter(degree) {
    const diopter = (degree / 100).toFixed(2);
    return diopter === '0.00' ? '0.00' : `-${diopter}`;
  },

  /**
   * 用户交互 - 设置近视度数
   */
  setMyopiaDegree(degree) {
    // 限制度数范围
    degree = Math.max(0, Math.min(500, degree));
    
    // 计算对应的模糊值
    const blurValue = this.myopiaDegreeToBlurPixels(degree);
    console.log(`度数: ${degree}, 模糊值: ${blurValue}px`);
    
    // 设置近视度数和对应的屏显度数及模糊值
    this.setData({
      myopiaDegree: degree,
      myopiaDiopter: this.formatDiopter(degree),
      blurValue: blurValue
    });
    
    // 更新教育提示
    this.updateEducationalTip(degree);
  },
  
  /**
   * 用户滑动度数滑块
   */
  onDegreeChange(e) {
    const degree = parseInt(e.detail.value);
    this.setMyopiaDegree(degree);
  },
  
  /**
   * 用户交互 - 设置预设度数
   */
  setDegree(e) {
    const degree = parseInt(e.currentTarget.dataset.degree);
    this.setMyopiaDegree(degree);
  },
  


  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 页面显示时重新检查相机状态
    if (this.data.cameraError) {
      this.checkCameraPermission();
    }
    
    // 恢复相机帧处理
    if (this.cameraContext && !this.cameraListener) {
      this.startCameraFrameProcessing();
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    // 暂停相机帧处理以节省资源
    if (this.cameraListener) {
      this.cameraListener.stop();
      this.cameraListener = null;
    }
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    // 清理资源
    if (this.cameraListener) {
      this.cameraListener.stop();
      this.cameraListener = null;
    }
    
    if (this.fpsHelper) {
      this.fpsHelper.reset();
    }
    
    // 释放 WebGL 资源
    if (this.gl) {
      const gl = this.gl;
      if (this.shaderProgram && this.shaderProgram.program) {
        gl.deleteProgram(this.shaderProgram.program);
      }
      if (this.buffers) {
        if (this.buffers.position) gl.deleteBuffer(this.buffers.position);
        if (this.buffers.textureCoord) gl.deleteBuffer(this.buffers.textureCoord);
      }
      if (this.texture) {
        gl.deleteTexture(this.texture);
      }
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '微信小程序 × MobileNet',
      path: 'packageAPI/pages/ai/mobilenet/index',
    }
  }
})