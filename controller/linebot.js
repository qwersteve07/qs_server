const receiveMessage = async (ctx) => {
	const body = ctx.request.body;
	const parseData = JSON.parse(body);

	ctx.status = 201;
	ctx.body = { message: "Data received", data: parseData };
};

export default { receiveMessage };
