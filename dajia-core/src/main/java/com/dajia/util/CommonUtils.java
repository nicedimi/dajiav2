package com.dajia.util;

import java.lang.reflect.Field;
import java.nio.ByteBuffer;
import java.nio.charset.Charset;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.Random;

import org.springframework.data.domain.Page;

import com.dajia.domain.Price;
import com.dajia.domain.Product;
import com.dajia.domain.ProductImage;
import com.dajia.vo.PaginationVO;

public class CommonUtils {

	public static final String return_val_success = "success";
	public static final String return_val_failed = "failed";

	public static final Long beijing_city_key = 110100L;
	public static final Long shanghai_city_key = 310100L;

	public static final Integer page_item_perpage = 20;
	public static final Integer page_range_limit = 10;

	public static final String cache_name_signup_code = "sms_signup_code";
	public static final String cache_name_signin_code = "sms_signin_code";
	public static final String cache_name_binding_code = "sms_binding_code";

	public static final String global_cache_key = "global_cache";

	public static final Integer reward_delay_days = 7;

	public static final String refund_type_refund = "Refund";
	public static final String refund_type_reward = "Reward";

	public static final String ref_user_id = "refUserId";
	public static final String product_id = "productId";
	public static final String null_string = "null";
	public static final String state_string = "STATE";

	public static String stringCharsetConvert(String str, String charset) {
		ByteBuffer bf = Charset.forName(charset).encode(str);
		return new String(bf.array());
	}

	public static PaginationVO generatePaginationVO(Page page, Integer currentPageIdx) {
		PaginationVO pv = new PaginationVO();
		pv.results = page.getContent();
		pv.totalPages = page.getTotalPages();
		pv.totalCount = page.getNumberOfElements();
		pv.currentPage = currentPageIdx;
		pv.hasPrev = page.hasPrevious();
		pv.hasNext = page.hasNext();
		if (page.getTotalPages() <= page_range_limit) {
			pv.startPage = 1;
			pv.endPage = page.getTotalPages();
		} else if (currentPageIdx <= page_range_limit) {
			pv.startPage = 1;
			pv.endPage = page_range_limit;
		} else {
			pv.startPage = currentPageIdx - page_range_limit + 1;
			pv.endPage = currentPageIdx;
		}
		pv.pageRange = new ArrayList<Integer>();
		for (int i = pv.startPage; i <= pv.endPage; i++) {
			pv.pageRange.add(i);
		}
		return pv;
	}

	public static void copyProperties(Object src, Object target) throws IllegalArgumentException,
			IllegalAccessException {
		Field[] fields = src.getClass().getFields();
		for (Field field : fields) {
			if (null != field.get(src)) {
				field.set(target, field.get(src));
			}
		}
	}

	public static void copyProductProperties(Product src, Product target) {
		// target.name = src.name;
		target.description = src.description;
		// target.postFee = src.postFee;
		target.imgUrl = src.imgUrl;
		target.imgThumbUrl = src.imgThumbUrl;
		if (null != src.productImages && src.productImages.size() > 0) {
			for (ProductImage pi : src.productImages) {
				pi.product = target;
			}
			target.productImages.clear();
			target.productImages.addAll(src.productImages);
		}
	}

	public static void updateProductWithReq(Product persist, Product req) {
		if (null != req.name) {
			persist.name = req.name;
		}
		if (null != req.brief) {
			persist.brief = req.brief;
		}
		if (null != req.stock) {
			persist.stock = req.stock;
		}
		if (null != req.buyQuota) {
			persist.buyQuota = req.buyQuota;
		}
		if (null != req.startDate) {
			persist.startDate = req.startDate;
		}
		if (null != req.expiredDate) {
			persist.expiredDate = req.expiredDate;
		}
		if (null != req.productStatus) {
			persist.productStatus = req.productStatus;
		}
		if (null != req.originalPrice) {
			if (persist.originalPrice == null || req.originalPrice.compareTo(persist.originalPrice) != 0) {
				persist.currentPrice = req.originalPrice;
			}
			persist.originalPrice = req.originalPrice;
		}
		// if (null != req.currentPrice) {
		// persist.currentPrice = req.currentPrice;
		// }
		if (null != req.postFee) {
			persist.postFee = req.postFee;
		}
		if (null != req.prices && req.prices.size() > 0) {
			if (null != persist.prices) {
				for (Price price : req.prices) {
					price.product = persist;
				}
				persist.prices.clear();
				persist.prices.addAll(req.prices);
			}
		}
	}

	public static long getLongValue(Long input) {
		return null != input ? input.longValue() : 0L;
	}

	public static String genRandomNum(int pwd_len) {
		int i;
		int count = 0;
		StringBuffer pwd = new StringBuffer("");
		Random r = new Random();
		while (count < pwd_len) {
			i = Math.abs(r.nextInt(10));
			pwd.append(i);
			count++;
		}
		return pwd.toString();
	}

	public static String genTrackingId(Long userId) {
		StringBuilder trackingId = new StringBuilder();
		String dateStr = new SimpleDateFormat("yyyyMMddHHmmss").format(new Date());
		String ranNum = String.valueOf(Math.round(Math.random() * 1000));
		trackingId.append(dateStr).append(userId).append(ranNum);
		return trackingId.toString();
	}

	public enum ActiveStatus {
		YES("Y"), NO("N");
		private String key;

		private ActiveStatus(String key) {
			this.key = key;
		}

		@Override
		public String toString() {
			return String.valueOf(this.key);
		}
	}

	public enum LocationType {
		PROVINCE("province"), CITY("city"), AREA("area");
		private String key;

		private LocationType(String key) {
			this.key = key;
		}

		@Override
		public String toString() {
			return String.valueOf(this.key);
		}
	}

	public enum OrderStatus {
		PENDING_PAY(1, "待付款"), PAIED(2, "待发货"), DELEVERING(3, "已发货"), DELEVRIED(4, "已签收"), CLOSED(5, "已关闭"), CANCELLED(
				6, "已取消");
		private Integer key;
		private String value;

		private OrderStatus(Integer key, String value) {
			this.key = key;
			this.value = value;
		}

		public Integer getKey() {
			return key;
		}

		public String getValue() {
			return value;
		}
	}

	public enum ProductStatus {
		INVALID(1, "下架"), VALID(2, "上架"), EXPIRED(3, "已过期");
		private Integer key;
		private String value;

		private ProductStatus(Integer key, String value) {
			this.key = key;
			this.value = value;
		}

		public Integer getKey() {
			return key;
		}

		public String getValue() {
			return value;
		}
	}

	public enum PayType {
		WECHAT(1, "wx_pub"), ALIPAY(2, "alipay_wap");
		private Integer key;
		private String value;

		private PayType(Integer key, String value) {
			this.key = key;
			this.value = value;
		}

		public Integer getKey() {
			return key;
		}

		public String getValue() {
			return value;
		}
	}

	public static String getPayTypeStr(Integer key) {
		String returnStr = null;
		if (key.equals(PayType.WECHAT.getKey())) {
			returnStr = PayType.WECHAT.getValue();
		} else if (key.equals(PayType.ALIPAY.getKey())) {
			returnStr = PayType.ALIPAY.getValue();
		}
		return returnStr;
	}

	public enum RewardStatus {
		PENDING(1, "待退款"), COMPLETED(2, "已退款"), CANCELLED(3, "已取消"), ERROR(3, "出错");
		private Integer key;
		private String value;

		private RewardStatus(Integer key, String value) {
			this.key = key;
			this.value = value;
		}

		public Integer getKey() {
			return key;
		}

		public String getValue() {
			return value;
		}
	}

	public enum RefundType {
		REFUND(0, "差价退款"), REWARD(1, "推荐奖励");
		private Integer key;
		private String value;

		private RefundType(Integer key, String value) {
			this.key = key;
			this.value = value;
		}

		public Integer getKey() {
			return key;
		}

		public String getValue() {
			return value;
		}
	}

	public enum LogisticAgent {
		SHUNFENG("shunfeng", "顺丰快递"), TIANTIAN("tiantian", "天天快递");
		private String key;
		private String value;

		private LogisticAgent(String key, String value) {
			this.key = key;
			this.value = value;
		}

		public String getKey() {
			return key;
		}

		public String getValue() {
			return value;
		}
	}
}