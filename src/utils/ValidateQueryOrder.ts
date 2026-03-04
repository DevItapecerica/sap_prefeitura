const ValidateQueryOrder = async (queryOrder: string, orderValues: string[]) => {
  const order = queryOrder.split(":");

  console.log("order: ", (order[1] === "asc" || order[1] === "desc"));
  if (orderValues.includes(order[0]) && (order[1] === "asc" || order[1] === "desc")) {
    return true;
  }
  else {
    return false;
  }
}

export default ValidateQueryOrder;