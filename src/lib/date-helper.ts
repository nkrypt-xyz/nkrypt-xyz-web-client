const epochToPrettyDateTime = (epoch) => {
  let options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
    timeZone: "Asia/Dhaka",
  };

  // @ts-ignore
  return new Intl.DateTimeFormat("en-US", options).format(epoch);
};

export { epochToPrettyDateTime };
