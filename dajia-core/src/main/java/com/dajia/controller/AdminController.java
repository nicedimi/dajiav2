package com.dajia.controller;

import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.dajia.domain.Product;
import com.dajia.domain.User;
import com.dajia.domain.UserOrder;
import com.dajia.repository.ProductRepo;
import com.dajia.repository.UserOrderRepo;
import com.dajia.service.OrderService;
import com.dajia.service.ProductService;
import com.dajia.service.UserService;
import com.dajia.util.CommonUtils;
import com.dajia.util.CommonUtils.OrderStatus;
import com.dajia.vo.OrderVO;
import com.dajia.vo.PaginationVO;

@RestController
public class AdminController extends BaseController {
	Logger logger = LoggerFactory.getLogger(AdminController.class);

	@Autowired
	private ProductRepo productRepo;

	@Autowired
	private UserOrderRepo orderRepo;

	@Autowired
	private OrderService orderService;

	@Autowired
	private ProductService productService;

	@Autowired
	private UserService userService;

	@RequestMapping("/admin/robotorder/{pid}")
	public @ResponseBody UserOrder robotOrder(@PathVariable("pid") Long pid) {
		UserOrder order = orderService.generateRobotOrder(pid, 1);
		return order;
	}

	@RequestMapping("/admin/sync")
	public @ResponseBody Map<String, String> syncAllProducts() {
		productService.syncProductsAll();
		Map<String, String> map = new HashMap<String, String>();
		map.put("result", "success");
		return map;
	}

	@RequestMapping("/admin/products/{page}")
	public PaginationVO<Product> productsByPage(@PathVariable("page") Integer pageNum) {
		Page<Product> products = productService.loadProductsByPage(pageNum);
		PaginationVO<Product> page = CommonUtils.generatePaginationVO(products, pageNum);
		return page;
	}

	@RequestMapping("/admin/product/{pid}")
	public Product product(@PathVariable("pid") Long pid) {
		Product product = productService.loadProductDetail(pid);
		return product;
	}

	@RequestMapping(value = "/admin/product/{pid}", method = RequestMethod.POST)
	public @ResponseBody Product modifyProduct(@PathVariable("pid") Long pid, @RequestBody Product productVO) {
		if (pid == productVO.productId) {
			Product product = productRepo.findOne(pid);
			CommonUtils.updateProductWithReq(product, productVO);
			productRepo.save(product);
			return product;
		} else {
			return null;
		}
	}

	@RequestMapping("/admin/users/{page}")
	public PaginationVO<User> usersByPage(@PathVariable("page") Integer pageNum) {
		Page<User> users = userService.loadUsersByPage(pageNum);
		PaginationVO<User> page = CommonUtils.generatePaginationVO(users, pageNum);
		return page;
	}

	@RequestMapping("/admin/orders/{page}")
	public PaginationVO<UserOrder> ordersByPage(@PathVariable("page") Integer pageNum, HttpServletRequest request) {
		String filterVal = request.getParameter("filter");
		Page<UserOrder> orders = orderService.loadOrdersByPage(pageNum, filterVal);
		PaginationVO<UserOrder> page = CommonUtils.generatePaginationVO(orders, pageNum);
		return page;
	}

	@RequestMapping("/admin/order/{orderId}")
	public OrderVO order(@PathVariable("orderId") Long orderId) {
		UserOrder order = orderRepo.findOne(orderId);
		if (null == order) {
			return null;
		}
		OrderVO ov = orderService.convertOrderVO(order);
		orderService.fillOrderVO(ov, order);
		return ov;
	}

	@RequestMapping("/admin/order/{orderId}/deliver")
	public UserOrder deliverOrder(@PathVariable("orderId") Long orderId, HttpServletRequest request) {
		String logisticTrackingId = request.getParameter("lti");
		String logisticAgent = request.getParameter("la");
		UserOrder order = orderRepo.findOne(orderId);
		order.orderStatus = OrderStatus.DELEVERING.getKey();
		order.logisticAgent = logisticAgent;
		order.logisticTrackingId = logisticTrackingId;
		orderRepo.save(order);
		return order;
	}

	@RequestMapping("/admin/order/{orderId}/close")
	public UserOrder closeOrder(@PathVariable("orderId") Long orderId) {
		UserOrder order = orderRepo.findOne(orderId);
		order.orderStatus = OrderStatus.CLOSED.getKey();
		orderRepo.save(order);
		return order;
	}
}
