import axios from "axios";

export const sendSMS = async (phone, message) => {
	const apiKey = process.env.smsApiKey;
	const senderId = process.env.smsSenderId;
	const url = process.env.smsUrl;

	const data = {
		api_key: apiKey,
		senderid: senderId,
		number: phone,
		message: message,
	};

	console.log(data)

	//console.log(data)

	try {
		const response = await axios.post(url, data);
		console.log("otp data " , response.data)
		return response.data;
	} catch (error) {
		//console.error("Failed to send SMS:", error);
		if (error.response) {
			//console.error("SMS API Error Data:", error.response.data);
			//console.error("SMS API Error Status:", error.response.status);
			//console.error("SMS API Error Headers:", error.response.headers);
		}
		throw new Error("Failed to send SMS");
	}
};
