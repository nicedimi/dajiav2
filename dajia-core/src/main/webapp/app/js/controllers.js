angular.module('dajia.controllers', [ "ui.bootstrap", "countTo" ]).controller('ProdCtrl',
		function($scope, $http, $cookies, $ionicLoading, $window, AuthService) {
			console.log('产品列表...');
			var loadProducts = function() {
				popLoading($ionicLoading);
				return $http.get('/products/').success(function(data, status, headers, config) {
					$scope.products = data;
					$scope.$broadcast('scroll.refreshComplete');
					$ionicLoading.hide();
				});
			}
			var checkOauthLogin = function() {
				if (!$cookies.get('dajia_user_id')) {
					$http.get('/user/loginuserinfo').success(function(data, status, headers, config) {
						var loginuser = data;
						if (null != loginuser['userId']) {
							AuthService.oauthLogin(loginuser);
						}
					}).error(function(data, status, headers, config) {
						console.log('request failed...');
					});
				}
			}
			checkOauthLogin();
			loadProducts();
			$scope.doRefresh = function() {
				loadProducts();
			};
			$scope.go2Product = function(productId) {
				$window.location.href = '#/tab/prod/' + productId;
			}
		})

.controller(
		'ProdDetailCtrl',
		function($scope, $rootScope, $stateParams, $http, $cookies, $window, $timeout, $ionicSlideBoxDelegate,
				$ionicModal, $ionicLoading) {
			console.log('产品详情...')
			$scope.favBtnTxt = '收藏';
			var element = angular.element(document.querySelector('#fav_icon'));
			modalInit($rootScope, $ionicModal, 'login');

			$http.get('/user/checkfav/' + $stateParams.pid).success(function(data, status, headers, config) {
				var isFav = data;
				$scope.isFav = isFav;
				if ($scope.isFav) {
					$scope.favBtnTxt = '已收藏';
					element.addClass('assertive');
				}
			}).error(function(data, status, headers, config) {
				console.log('request failed...');
			});

			$scope.buyNow = function() {
				if ($cookies.get('dajia_user_id') == null) {
					$rootScope.$broadcast('event:auth-loginRequired');
				} else {
					$window.location.href = '#/tab/prodorder/' + $stateParams.pid;
				}
			}

			$scope.add2Fav = function() {
				if ($cookies.get('dajia_user_id') == null) {
					$rootScope.$broadcast('event:auth-loginRequired');
				} else {
					if ($scope.isFav) {
						$http.get('/user/favourite/remove/' + $stateParams.pid).success(
								function(data, status, headers, config) {
									popWarning('已取消收藏', $timeout, $ionicLoading);
									$scope.isFav = false;
									$scope.favBtnTxt = '收藏';
									element.removeClass('assertive');
								}).error(function(data, status, headers, config) {
							console.log('request failed...');
						});
					} else {
						$http.get('/user/favourite/add/' + $stateParams.pid).success(
								function(data, status, headers, config) {
									popWarning('收藏成功', $timeout, $ionicLoading);
									$scope.isFav = true;
									$scope.favBtnTxt = '已收藏';
									element.addClass('assertive');
								}).error(function(data, status, headers, config) {
							console.log('request failed...');
						});
					}
				}
			}
			$scope.share = function() {
				shareProduct($rootScope, $cookies, $timeout, $ionicLoading, $scope.product);
			}
			$scope.back = function() {
				$window.location.replace('#/tab/prod');
			}
			popLoading($ionicLoading);
			$http.get('/product/' + $stateParams.pid).success(
					function(data, status, headers, config) {
						var product = data;
						$scope.product = product;
						$ionicSlideBoxDelegate.update();
						$scope.orderNeeded = product.maxOrder - product.orderNum;
						$scope.nextPriceOff = product.priceOff / product.maxOrder;
						var amt = (product.originalPrice - product.currentPrice)
								/ (product.originalPrice - product.targetPrice) * 100;
						$scope.countTo = product.currentPrice;
						$scope.countFrom = product.originalPrice;
						$ionicLoading.hide();
						$timeout(function() {
							$scope.progressValue = amt;
						}, 1000);
					});
			$scope.progressValue = 0;

			initWechatJSAPI($http);
		})

.controller(
		'OrderCtrl',
		function($scope, $rootScope, $stateParams, $http, $window, $ionicModal, $timeout, $ionicLoading) {
			console.log('订单页面...')
			var productReady = false;
			var locationReady = false;
			popLoading($ionicLoading);
			modalInit($rootScope, $ionicModal, 'login');
			$scope.userContact = {};
			$scope.userContacts = [];
			$scope.selectedUserContact = {};
			$scope.order = {
				'quantity' : 1,
				'unitPrice' : 0,
				'totalPrice' : 0,
				'payType' : 1
			};
			var quota = 5;
			$http.get('/product/' + $stateParams.pid).success(function(data, status, headers, config) {
				var product = data;
				$scope.orderItem = product;
				// $scope.totalPrice = product.price;
				quota = product.buyQuota;
				$scope.order.productId = product.productId;
				$scope.order.unitPrice = product.currentPrice;
				$scope.order.postFee = product.postFee;
				$scope.order.totalPrice = $scope.order.quantity * $scope.order.unitPrice + $scope.order.postFee;
				if (locationReady) {
					$ionicLoading.hide();
				}
				productReady = true;
			});
			$http.get('/user/loginuserinfo').success(
					function(data, status, headers, config) {
						var loginuser = data;
						$scope.loginuser = loginuser;
						if (null != $scope.loginuser.userContacts) {
							loginuser.userContacts.forEach(function(c) {
								var contact = {
									contactId : c.contactId,
									name : c.contactName,
									mobile : c.contactMobile,
									address : c.province.locationValue + ' ' + c.city.locationValue + ' '
											+ c.district.locationValue + ' ' + c.address1,
									summary : c.contactName + ' ' + c.contactMobile + ' ' + c.province.locationValue
											+ ' ' + c.city.locationValue + ' ' + c.district.locationValue + ' '
											+ c.address1
								};
								$scope.userContacts.push(contact);
							});
							// console.log($scope.userContacts);
						}
					}).error(function(data, status, headers, config) {
				console.log('request failed...');
			});
			$http.get('/locations').success(function(data, status, headers, config) {
				$scope.provinces = data;
				if ($scope.loginuser.userContact != null) {
					$scope.userContact = $scope.loginuser.userContact;
					fillLocationDropdowns($scope, $ionicLoading, locationReady);
				} else {
					if (productReady) {
						$ionicLoading.hide();
					}
					locationReady = true;
				}
			}).error(function(data, status, headers, config) {
				console.log('request failed...');
			});
			$scope.submit = function() {
				if ($scope.userContact.contactId == null) {
					console.log('new userContact.');
				}
				var name = $scope.userContact.contactName;
				var mobile = $scope.userContact.contactMobile;
				var province = $scope.userContact.province;
				var city = $scope.userContact.city;
				var district = $scope.userContact.district;
				var address = $scope.userContact.address1;

				if (!name || !mobile || !province || !city || !district || !address) {
					popWarning('请输入完整信息', $timeout, $ionicLoading);
					return;
				}

				if (mobile.length != 11 || !DajiaGlobal.utils.mobileReg.test(mobile)) {
					popWarning('请数据正确的手机号码', $timeout, $ionicLoading);
					return;
				}

				$scope.order.userContact = $scope.userContact;
				var refUserId = DajiaGlobal.utils.getURLParameter('refUserId');
				var productId = DajiaGlobal.utils.getURLParameter('productId');
				if (null != refUserId && productId == $scope.order.productId) {
					console.log("refUserId:" + refUserId);
					$scope.order.refUserId = refUserId;
				}

				$http.post('/user/submitOrder', $scope.order).success(function(data, status, headers, config) {
					var charge = data;
					console.log(charge);
					if (null == charge || charge.length == 0) {
						popWarning('订单生成出错或商品已经售完', $timeout, $ionicLoading);
					} else {
						pingpp.createPayment(charge, function(result, error) {
							if (result == 'success') {
								// 只有微信公众账号 wx_pub 支付成功的结果会在这里返回，其他的 wap 支付结果都是在
								// extra
								// 中对应的URL 跳转。
								console.log('wechat pay success');
								popWarning('支付成功', $timeout, $ionicLoading);
								$timeout(function() {
									if (null != charge['orderNo']) {
										$window.location.replace('#/tab/prod');
										$window.location.href = "#/tab/prog/" + charge['order_no'];
									} else {
										$window.location.replace('#/tab/prod');
										$window.location.href = "#/tab/prog";
									}
								}, 1000);
							} else if (result == 'fail') {
								// charge 不正确或者微信公众账号支付失败时会在此处返回
								console.log('payment failed');
								popWarning('支付出错', $timeout, $ionicLoading);
								for (key in error) {
									alert(key + ': ' + error[key]);
								}
							} else if (result == 'cancel') {
								// 微信公众账号支付取消支付
								console.log('wechat pay cancelled');
							}
						});
					}
				}).error(function(data, status, headers, config) {
					console.log('request failed...');
				});
			}
			$scope.add = function() {
				if ($scope.order.quantity >= quota && quota != null) {
					popWarning('该产品每个账号限购' + quota + '件', $timeout, $ionicLoading);
					return;
				}
				if ($scope.order.quantity > $scope.orderItem.stock) {
					popWarning('该产品库存不足', $timeout, $ionicLoading);
					return;
				}
				$scope.order.quantity += 1;
				$scope.order.totalPrice = $scope.order.quantity * $scope.order.unitPrice + $scope.order.postFee;
			}
			$scope.remove = function() {
				if ($scope.order.quantity > 1) {
					$scope.order.quantity -= 1;
					$scope.order.totalPrice = $scope.order.quantity * $scope.order.unitPrice + $scope.order.postFee;
				}
			}
			$scope.selectAlipay = function() {
				popWarning('由于微信技术屏蔽，选择支付宝购买可能需要打开独立浏览器。', $timeout, $ionicLoading);
			}
			$scope.changeUserContact = function(uc) {
				if (null != $scope.loginuser.userContacts && null != $scope.selectedUserContact.contactId) {
					$scope.loginuser.userContacts.forEach(function(c) {
						if (c.contactId == $scope.selectedUserContact.contactId) {
							$scope.userContact = c;
						}
					});
				}
				fillLocationDropdowns($scope, $ionicLoading, locationReady);
			}

			var fillLocationDropdowns = function($scope, $ionicLoading, locationReady) {
				$scope.provinces.forEach(function(p) {
					if (p.locationKey == $scope.userContact.province.locationKey) {
						$scope.userContact.province = p;
						p.children.forEach(function(c) {
							if (c.locationKey == $scope.userContact.city.locationKey) {
								$scope.userContact.city = c;
								c.children.forEach(function(d) {
									if (d.locationKey == $scope.userContact.district.locationKey) {
										$scope.userContact.district = d;
										if (productReady) {
											$ionicLoading.hide();
										}
										locationReady = true;
										return;
									}
								});
								return;
							}
						});
						return;
					}
				});
			}
		})

.controller('ProgCtrl', function($scope, $rootScope, $window, $http, $cookies, $ionicModal, $timeout, $ionicLoading) {
	console.log('进度列表...');
	$scope.loginUser = $cookies.get('dajia_user_id');
	modalInit($rootScope, $ionicModal, 'login');
	$scope.login = function() {
		if ($scope.loginUser == null) {
			$rootScope.$broadcast('event:auth-loginRequired');
		} else {
			$window.location.reload();
		}
	}
	var loadProgress = function() {
		popLoading($ionicLoading);
		$http.get('/user/progress').success(function(data, status, headers, config) {
			var orders = data;
			orders.forEach(function(o) {
				o.progressValue = o.product.priceOff / (o.product.originalPrice - o.product.targetPrice) * 100;
			});
			$scope.myOrders = orders;
			$scope.$broadcast('scroll.refreshComplete');
			$ionicLoading.hide();
		});
	}
	if ($scope.loginUser != null) {
		loadProgress();
	}
	$scope.doRefresh = function() {
		loadProgress();
	}
	$scope.goHome = function() {
		$window.location.href = '#/tab/prod';
	}
	$scope.progressDetail = function(trackingId) {
		$window.location.href = '#/tab/prog/' + trackingId;
	}
	$scope.share = function(productId, productName) {
		var product = {
			'productId' : productId,
			'name' : productName
		};
		shareProduct($rootScope, $cookies, $timeout, $ionicLoading, product);
	}
	initWechatJSAPI($http);
})

.controller(
		'ProgDetailCtrl',
		function($scope, $rootScope, $cookies, $stateParams, $http, $window, $ionicModal, $timeout, $ionicLoading) {
			console.log('进度详情...')
			$scope.order = {};
			popLoading($ionicLoading);
			$http.get('/user/order/' + $stateParams.trackingId).success(
					function(data, status, headers, config) {
						console.log(data);
						var order = data;
						order.progressValue = order.product.priceOff
								/ (order.product.originalPrice - order.product.targetPrice) * 100;
						$scope.order = order;
						$ionicLoading.hide();
					});
			$scope.order.progressValue = 0;
			$scope.share = function() {
				shareProduct($rootScope, $cookies, $timeout, $ionicLoading, $scope.order.product);
			}
			$scope.back = function() {
				$window.location.replace('#/tab/prog');
			}
			initWechatJSAPI($http);
		})

.controller('MineCtrl', function($scope, $rootScope, $http, $window, $cookies, $timeout, $ionicLoading, AuthService) {
	console.log('我的打价...');
	$scope.userName = $cookies.get('dajia_username');
	var loginUser = $cookies.get('dajia_user_id');
	if (loginUser != null) {
		$http.get('/user/loginuserinfo').success(function(data, status, headers, config) {
			$scope.headImgUrl = data.headImgUrl;
		});
	}
	$scope.myOrders = function() {
		if (loginUser == null) {
			$rootScope.$broadcast('event:auth-loginRequired');
		} else {
			$window.location.href = '#/tab/mine/orders';
		}
	}
	$scope.myFav = function() {
		if (loginUser == null) {
			$rootScope.$broadcast('event:auth-loginRequired');
		} else {
			$window.location.href = '#/tab/mine/fav';
		}
	}
	$scope.contacts = function() {
		if (loginUser == null) {
			$rootScope.$broadcast('event:auth-loginRequired');
		} else {
			$window.location.href = '#/tab/mine/contacts';
		}
	}
	$scope.bindMobile = function() {
		if (loginUser == null) {
			$rootScope.$broadcast('event:auth-loginRequired');
		} else {
			$window.location.href = '#/tab/mine/bindmobile';
		}
	}
	$scope.myPass = function() {
		if (loginUser == null) {
			$rootScope.$broadcast('event:auth-loginRequired');
		} else {
			$window.location.href = '#/tab/mine/password';
		}
	}
	$scope.logout = function() {
		if (loginUser == null) {
			$window.location.reload();
		} else {
			AuthService.logout(loginUser);
		}
	};
	$scope.$on('event:auth-logout-complete', function() {
		popWarning('退出登录成功', $timeout, $ionicLoading);
		$timeout(function() {
			$window.location.reload();
		}, 500);
		// $scope.openModal('login');
	});
})

.controller('MyOrdersCtrl', function($scope, $http, $window, $stateParams, $ionicLoading) {
	console.log('我的订单...');
	var loadOrders = function() {
		popLoading($ionicLoading);
		return $http.get('/user/myorders').success(function(data, status, headers, config) {
			$scope.myOrders = data;
			$scope.$broadcast('scroll.refreshComplete');
			$ionicLoading.hide();
		});
	}
	loadOrders();
	$scope.doRefresh = function() {
		loadOrders();
	};
	$scope.orderDetail = function(trackingId) {
		$window.location.href = '#/tab/mine/order/' + trackingId;
	}
})

.controller(
		'MyOrderDetailCtrl',
		function($scope, $http, $stateParams, $window, $ionicLoading) {
			console.log('我的订单详情...');
			var loadOrderDetail = function() {
				popLoading($ionicLoading);
				return $http.get('/user/order/' + $stateParams.trackingId).success(
						function(data, status, headers, config) {
							console.log(data);
							$scope.order = data;
							$scope.checkLogisticUrl = "http://m.kuaidi100.com/index_all.html?type="
									+ data.logisticAgent + "&postid=" + data.logisticTrackingId + "&callbackurl="
									+ $window.location.href;
							$ionicLoading.hide();
						});
			}
			loadOrderDetail();
		})

.controller('MyFavCtrl', function($scope, $http, $ionicLoading) {
	console.log('我的收藏...');
	var loadFavs = function() {
		popLoading($ionicLoading);
		return $http.get('/user/favourites').success(function(data, status, headers, config) {
			$scope.products = data;
			$scope.$broadcast('scroll.refreshComplete');
			$ionicLoading.hide();
		});
	}
	loadFavs();
	$scope.doRefresh = function() {
		loadFavs();
	};
})

.controller('MyPassCtrl', function($scope, $http, $timeout, $ionicLoading) {
	console.log('修改密码...');
	$scope.form = {};
	$scope.submit = function() {
		var oldPassword = $scope.form.oldPassword;
		var newPassword = $scope.form.newPassword;
		var newPasswordConfirm = $scope.form.newPasswordConfirm;
		if (!oldPassword || !newPassword || !newPasswordConfirm) {
			popWarning('请输入完整信息', $timeout, $ionicLoading);
			return;
		}
		if (newPassword.length < 6) {
			popWarning('请输入至少六位数的密码', $timeout, $ionicLoading);
			return;
		}
		if (newPassword != newPasswordConfirm) {
			popWarning('两次输入的新密码不一致', $timeout, $ionicLoading);
			return;
		}
		if (newPassword == oldPassword) {
			popWarning('新密码不能与老密码相同', $timeout, $ionicLoading);
			return;
		}
		$http.post('/user/changePassword', $scope.form).success(function(data, status, headers, config) {
			var msg = data.msg;
			popWarning(msg, $timeout, $ionicLoading);
		}).error(function(data, status, headers, config) {
			console.log('request failed...');
		});

	};
})

.controller('ListContactCtrl', function($scope, $http, $timeout, $ionicLoading) {
	console.log('收货地址列表...');
	var loadContacts = function() {
		popLoading($ionicLoading);
		return $http.get('/user/contacts').success(function(data, status, headers, config) {
			$scope.contacts = data;
			$ionicLoading.hide();
		});
	}
	loadContacts();
})

.controller(
		'EditContactCtrl',
		function($scope, $http, $stateParams, $window, $timeout, $ionicLoading) {
			console.log('收货地址管理...');
			popLoading($ionicLoading);
			$http.get('/user/contact/' + $stateParams.contactId).success(function(data, status, headers, config) {
				console.log(data);
				$scope.userContact = data;
				var isNewContact = false;
				if (data == null || data.length == 0) {
					isNewContact = true;
					$scope.userContact = {};
				}
				$http.get('/locations').success(function(data, status, headers, config) {
					$scope.provinces = data;
					if (!isNewContact) {
						$scope.provinces.forEach(function(p) {
							if (p.locationKey == $scope.userContact.province.locationKey) {
								$scope.userContact.province = p;
								p.children.forEach(function(c) {
									if (c.locationKey == $scope.userContact.city.locationKey) {
										$scope.userContact.city = c;
										c.children.forEach(function(d) {
											if (d.locationKey == $scope.userContact.district.locationKey) {
												$scope.userContact.district = d;
												$ionicLoading.hide();
												return;
											}
										});
										return;
									}
								});
								return;
							}
						});
					} else {
						$ionicLoading.hide();
					}
				}).error(function(data, status, headers, config) {
					console.log('request failed...');
				});
			});

			$scope.remove = function() {
				if ($scope.userContact.contactId != null) {
					$http.get('/user/contact/remove/' + $stateParams.contactId).success(
							function(data, status, headers, config) {
								popWarning('收货信息删除成功', $timeout, $ionicLoading);
								$window.location.href = '#/tab/mine/contacts';
								$window.location.reload();
							});
				} else {
					$window.location.href = '#/tab/mine/contacts';
				}
			}

			$scope.markDefault = function() {
				$http.get('/user/contact/default/' + $stateParams.contactId).success(
						function(data, status, headers, config) {
							popWarning('成功设置为默认收货信息', $timeout, $ionicLoading);
							$window.location.href = '#/tab/mine/contacts';
							$window.location.reload();
						});
			}

			$scope.submit = function() {
				if ($scope.userContact.contactId == null) {
					console.log('new userContact.');
				}
				var name = $scope.userContact.contactName;
				var mobile = $scope.userContact.contactMobile;
				var province = $scope.userContact.province;
				var city = $scope.userContact.city;
				var district = $scope.userContact.district;
				var address = $scope.userContact.address1;

				if (!name || !mobile || !province || !city || !district || !address) {
					popWarning('请输入完整信息', $timeout, $ionicLoading);
					return;
				}

				if (mobile.length != 11 || !DajiaGlobal.utils.mobileReg.test(mobile)) {
					popWarning('请数据正确的手机号码', $timeout, $ionicLoading);
					return;
				}
				$http.post('/user/contact/' + $stateParams.contactId, $scope.userContact).success(
						function(data, status, headers, config) {
							popWarning('收货信息修改成功', $timeout, $ionicLoading);
							$window.location.href = '#/tab/mine/contacts';
							$window.location.reload();
						});
			}
		})

.controller('BindMobileCtrl', function($scope, $http, $q, $cookies, $timeout, $ionicLoading) {
	console.log('绑定手机...');
	var userId = $cookies.get('dajia_user_id');
	$scope.userMobile = $cookies.get('dajia_user_mobile');
	$scope.user = {
		'userId' : userId,
		'mobile' : null,
		'bindingCode' : null
	};
	$scope.smsBtnTxt = '发送手机验证码';
	$scope.smsBtnDisable = false;
	var smsBtn = angular.element(document.querySelector('#smsBtn'));
	var checkMobile = function(mobile) {
		var defer = $q.defer();
		$http.get('/signupCheck/' + mobile).success(function(data, status, headers, config) {
			if ("success" == data.result) {
				defer.resolve(true);
			} else {
				popWarning('该手机号已被其他账号绑定', $timeout, $ionicLoading);
				defer.resolve(false);
			}
		}).error(function(data, status, headers, config) {
			console.log('request failed...');
			defer.reject();
		});
		return defer.promise;
	}

	$scope.getBindingCode = function() {
		var mobile = $scope.user.mobile;

		if (!mobile || mobile.length != 11 || !DajiaGlobal.utils.mobileReg.test(mobile)) {
			popWarning('请输入正确的手机号码', $timeout, $ionicLoading);
			return;
		}
		checkMobile(mobile).then(function(mobileValid) {
			if (mobileValid) {
				sendSmsMessage($scope, $http, $timeout, $ionicLoading, '/bindingSms/', mobile);
			}
		});
	}

	$scope.submit = function() {
		if (!$scope.user.mobile || !$scope.user.bindingCode) {
			popWarning('请输入完整信息', $timeout, $ionicLoading);
			return;
		}
		$http.post('/bindMobile', $scope.user).success(function(data, status, headers, config) {
			if (null != data && data.result == 'success') {
				popWarning('已成功绑定新的手机号码', $timeout, $ionicLoading);
				$cookies.put('dajia_user_mobile', $scope.user.mobile, {
					path : '/'
				});
				$scope.userMobile = $scope.user.mobile;
				$scope.user.mobile = null;
				$scope.user.bindingCode = null;
			} else {
				popWarning('绑定失败', $timeout, $ionicLoading);
			}
		});
	};
})

.controller('SignInCtrl',
		function($scope, $rootScope, $window, $http, $q, $ionicLoading, $timeout, $ionicModal, AuthService) {
			$scope.login = {
				'mobile' : null,
				'signinCode' : null
			};

			$scope.smsBtnTxt = '发送手机验证码';
			$scope.smsBtnDisable = false;
			var smsBtn = angular.element(document.querySelector('#smsBtn'));

			var checkMobile = function(mobile) {
				var defer = $q.defer();
				$http.get('/signupCheck/' + mobile).success(function(data, status, headers, config) {
					if ("failed" == data.result) {
						defer.resolve(true);
					} else {
						popWarning('该手机号未被绑定，请先用微信登录后再绑定手机', $timeout, $ionicLoading);
						defer.resolve(false);
					}
				}).error(function(data, status, headers, config) {
					console.log('request failed...');
					defer.reject();
				});
				return defer.promise;
			}

			$scope.getSigninCode = function() {
				var mobile = $scope.login.mobile;

				if (!mobile || mobile.length != 11 || !DajiaGlobal.utils.mobileReg.test(mobile)) {
					popWarning('请输入正确的手机号码', $timeout, $ionicLoading);
					return;
				}
				checkMobile(mobile).then(function(mobileValid) {
					if (mobileValid) {
						sendSmsMessage($scope, $http, $timeout, $ionicLoading, '/signinSms/', mobile);
					}
				});
			}

			$scope.submit = function() {
				if (!$scope.login.mobile || !$scope.login.signinCode) {
					popWarning('请输入完整信息', $timeout, $ionicLoading);
					return;
				}
				AuthService.login($scope.login);
			};

			$scope.$on('event:auth-loginRequired', function(e, rejection) {
				$scope.openModal('login');
			});

			$scope.$on('event:auth-loginConfirmed', function() {
				$scope.closeModal('login');
				popWarning('登陆成功', $timeout, $ionicLoading);
				$timeout(function() {
					$window.location.reload();
				}, 500);
			});

			$scope.$on('event:auth-login-failed', function(e, status) {
				var error = '登录失败';
				if (status == 401) {
					error = '验证码错误';
				}
				popWarning(error, $timeout, $ionicLoading);
			});

			$scope.wechatLogin = function() {
				$window.location.href = '/wechat/login';
			}

			// deprecated
			modalInit($rootScope, $ionicModal, 'signup');
			$scope.signup = function() {
				$scope.openModal('signup');
			}
		})

.controller('SignUpCtrl', function($scope, $http, $q, $ionicLoading, $timeout, AuthService) {
	$scope.signup = {
		'mobile' : null,
		'password' : null,
		'signupCode' : null
	};
	$scope.smsBtnTxt = '发送手机验证码';
	$scope.smsBtnDisable = false;
	var smsBtn = angular.element(document.querySelector('#smsBtn'));

	var checkMobile = function(mobile) {
		var defer = $q.defer();
		$http.get('/signupCheck/' + mobile).success(function(data, status, headers, config) {
			if ("success" == data.result) {
				defer.resolve(true);
			} else {
				popWarning('该手机号已被注册', $timeout, $ionicLoading);
				defer.resolve(false);
			}
		}).error(function(data, status, headers, config) {
			console.log('request failed...');
			defer.reject();
		});
		return defer.promise;
	}

	$scope.getSignupCode = function() {
		var mobile = $scope.signup.mobile;

		if (!mobile || mobile.length != 11 || !DajiaGlobal.utils.mobileReg.test(mobile)) {
			popWarning('请输入正确的手机号码', $timeout, $ionicLoading);
			return;
		}
		checkMobile(mobile).then(function(mobileValid) {
			if (mobileValid) {
				sendSmsMessage($scope, $http, $timeout, $ionicLoading, '/signupSms/', mobile);
			}
		});
	}

	$scope.submit = function() {
		var mobile = $scope.signup.mobile;
		var password = $scope.signup.password;
		var signupCode = $scope.signup.signupCode;
		if (!mobile || !password || !signupCode) {
			popWarning('请输入完整信息', $timeout, $ionicLoading);
			return;
		}

		if (mobile.length != 11 || !DajiaGlobal.utils.mobileReg.test(mobile)) {
			popWarning('请数据正确的手机号码', $timeout, $ionicLoading);
			return;
		}
		if (password.length < 6) {
			popWarning('请输入至少六位数的密码', $timeout, $ionicLoading);
			return;
		}
		checkMobile(mobile).then(function(mobileValid) {
			if (mobileValid) {
				AuthService.signup($scope.signup);
			}
		});
	};

	$scope.$on('event:auth-signup-failed', function(e, status) {
		var error = '注册失败，验证码错误';
		popWarning(error, $timeout, $ionicLoading);
	});

	$scope.$on('event:auth-signup-success', function() {
		$scope.closeModal('signup');
		popWarning('注册成功', $timeout, $ionicLoading);
	});
})

.controller('SignOutCtrl', function($scope, AuthService) {
	AuthService.logout();
})

.controller('PayCtrl', function($scope, $http, $ionicLoading, $timeout, $document) {
	console.log('订单支付...');
	$scope.confirmPay = function(order) {
		console.log(order);
		var payBtn = angular.element(document.querySelector('#payBtn'));
	}
});

var modalInit = function($rootScope, $ionicModal, modalType) {
	// console.log($ionicModal);
	$ionicModal.fromTemplateUrl('templates/' + modalType + '.html', {
		scope : $rootScope,
		animation : 'slide-in-up'
	}).then(function(modal) {
		$rootScope['modal_' + modalType] = modal;
	});
	$rootScope.openModal = function(type) {
		$rootScope['modal_' + type].show();
	};
	$rootScope.closeModal = function(type) {
		$rootScope['modal_' + type].hide();
	};
	$rootScope.$on('$destroy', function() {
		$rootScope['modal_' + modalType].remove();
	});
}

var payModalInit = function($scope, $ionicModal, callback) {
	$ionicModal.fromTemplateUrl('templates/pay.html', {
		scope : $scope,
		animation : 'slide-in-up'
	}).then(function(modal) {
		$scope.payModal = modal;
		callback();
	});
	$scope.openPayModal = function(order) {
		$scope.order = order;
		$scope.payModal.show();
	};
	$scope.closePayModal = function() {
		$scope.payModal.hide();
	};
	$scope.$on('$destroy', function() {
		$scope.payModal.remove();
	});
}

var popWarning = function(msg, $timeout, $ionicLoading) {
	$ionicLoading.show({
		template : msg
	});
	$timeout(function() {
		$ionicLoading.hide();
	}, 1500);
}

var popLoading = function($ionicLoading) {
	$ionicLoading.show({
		template : '加载中...'
	});
}

var sendSmsMessage = function($scope, $http, $timeout, $ionicLoading, methodPath, mobile) {
	var counter = 60;
	var onTimeout = function() {
		counter--;
		if (counter == 0) {
			$scope.smsBtnTxt = '发送手机验证码';
			$scope.smsBtnDisable = false;
			return false;
		}
		$scope.smsBtnTxt = '发送手机验证码 (' + counter + ')';
		mytimeout = $timeout(onTimeout, 1000);
	}
	var mytimeout = $timeout(onTimeout, 1000);
	$scope.smsBtnDisable = true;

	$http.get(methodPath + mobile).success(function(data, status, headers, config) {
		if ("success" == data.result) {
			popWarning('验证码已发送', $timeout, $ionicLoading);
		} else {
			popWarning('验证码发送失败', $timeout, $ionicLoading);
		}
	}).error(function(data, status, headers, config) {
		console.log('request failed...');
	});
}

var initWechatJSAPI = function($http) {
	$http.get('/wechat/signature').success(function(data, status, headers, config) {
		console.log(data);
		wx.config({
			appId : data['appId'],
			timestamp : data['timestamp'],
			nonceStr : data['nonceStr'],
			signature : data['signature'],
			jsApiList : [ 'checkJsApi', 'onMenuShareAppMessage', 'onMenuShareTimeline' ]
		});
		wx.checkJsApi({
			jsApiList : [ 'onMenuShareAppMessage', 'onMenuShareTimeline' ],
			success : function(res) {
				console.log(res);
			}
		});
		wx.ready(function() {

		});
	});
}

var shareProduct = function($rootScope, $cookies, $timeout, $ionicLoading, product) {
	var userId = $cookies.get('dajia_user_id');
	if (userId == null) {
		$rootScope.$broadcast('event:auth-loginRequired');
	} else {
		popWarning('分享信息准备完毕。请点击右上角微信菜单-发送给朋友', $timeout, $ionicLoading);
		wx.onMenuShareAppMessage({
			title : '打价网',
			desc : product.name,
			link : 'http://51daja.com/app/index.html?refUserId=' + userId + '&productId=' + product.productId
					+ '#/tab/prod/' + product.productId,
			imgUrl : 'http://51daja.com/app/img/logo.png',
			trigger : function() {
				console.log('click');
			},
			success : function() {
				popWarning('分享成功！', $timeout, $ionicLoading);
			},
			cancel : function() {
				console.log('cancel');
			}
		});
		wx.onMenuShareTimeline({
			title : '打价网 - ' + product.name,
			link : 'http://51daja.com/app/index.html?refUserId=' + userId + '&productId=' + product.productId
					+ '#/tab/prod/' + product.productId,
			imgUrl : 'http://51daja.com/app/img/logo.png',
			trigger : function() {
				console.log('click');
			},
			success : function() {
				popWarning('分享成功！', $timeout, $ionicLoading);
			},
			cancel : function() {
				console.log('cancel');
			}
		});
	}
}