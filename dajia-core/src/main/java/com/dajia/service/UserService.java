package com.dajia.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.dajia.domain.User;
import com.dajia.repository.UserRepo;
import com.dajia.util.EncodingUtil;
import com.dajia.util.UserUtils;

@Service
public class UserService {
	Logger logger = LoggerFactory.getLogger(UserService.class);

	@Autowired
	private UserRepo userRepo;

	public User userSignup(User user) {
		user.password = EncodingUtil.encode("SHA1", user.password);
		user.userName = UserUtils.generateUserName(user.mobile);
		userRepo.save(user);
		return user;
	}

	public User userLogin(String mobile, String password, boolean authIgnore) {
		User user = userRepo.findByMobile(mobile);
		password = EncodingUtil.encode("SHA1", password);
		if (!authIgnore) {
			if (null == user || !user.password.equals(password)) {
				return null;
			}
		}
		return user;
	}
}