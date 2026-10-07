const cfg={hash_salt:'s'};//@LIB
return {sha:sha256('abc'),sha2:sha256('日本語'),p:[normPhone('0812-3456-7890'),normPhone('628123456789@c.us'),normPhone('+81 90 1234 5678'),normPhone('12345'),normPhone('8123456789')]};
