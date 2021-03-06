package com.dajia.util;

import java.io.UnsupportedEncodingException;
import java.math.BigDecimal;

import org.junit.Test;

public class TestUtils {

	@Test
	public void test() throws UnsupportedEncodingException {
		String[] strings = { "æµ¦", "ä¸æµ·", "上海", "æµ¦ä¸æ°åº" };
		for (String string : strings) {
			String res = CommonUtils.stringCharsetConvert(string, "ISO-8859-1");
			System.out.println(string + ":" + res);
		}
		String password = "654321";
		password = EncodingUtil.encode("SHA1", password);
		System.out.println(password);
	}

	@Test
	public void test2() {
		Integer value = 1;
		BigDecimal bigVal = new BigDecimal(new Double(value) / 100);
		System.out.println(bigVal.doubleValue());
	}

	@Test
	public void test3() {
		String str = "redirect:app/index.html#" + null;
		System.out.println(str);
	}
}
