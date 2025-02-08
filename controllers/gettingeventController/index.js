import moment from "moment";
import { Event } from "../../mongooseSchema/eventScema/index.js";

export const getingevents = async (req, res) => {
    const { date } = req.query;
    try {
      let query = {};
  
      if (date) {
        const today = moment().startOf('day');
  
        if (date === 'yesterday') {
          query.dateTime = {
            $gte: today.clone().subtract(1, 'days').toDate(),
            $lt: today.toDate(),
          };
        } else if (date === 'today') {
          query.dateTime = {
            $gte: today.toDate(),
            $lt: today.clone().add(1, 'days').toDate(),
          };
        } else if (date === 'tomorrow') {
          query.dateTime = {
            $gte: today.clone().add(1, 'days').toDate(),
            $lt: today.clone().add(2, 'days').toDate(),
          };
        }
      }
  
      const events = await Event.find(query);
      if (events) {
        res.json(events);
      } else {
        res.json({message:'no eents there'})
      }
  
    } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json({ error: 'Internal server error' });
    }

}
