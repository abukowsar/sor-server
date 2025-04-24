import { Olympiad } from "../models/olympiadModel.js";

export const createOlympiad = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      registrationLink, 
      eventDate, 
      registrationDeadline,
      venue,
      organizer,
      category 
    } = req.body;

    const olympiad = await Olympiad.create({
      title,
      description,
      registrationLink,
      eventDate: new Date(eventDate),
      registrationDeadline: new Date(registrationDeadline),
      venue,
      organizer,
      category,
      createdBy: req.user._id
    });

    return res.status(201).json({
      success: true,
      message: "Olympiad created successfully",
      data: olympiad
    });
  } catch (error) {
    console.error("Create olympiad error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create olympiad"
    });
  }
};

export const getAllOlympiads = async (req, res) => {
    try {
      const { 
        search, 
        category, 
        status,
        startDate,
        endDate,
        organizer,
        page = 1, 
        limit = 10,
        sortBy = 'eventDate',
        sortOrder = 'asc'
      } = req.query;
      
      const skip = (page - 1) * limit;
      let query = {};
  
      // Search filter
      if (search) {
        query.$or = [
          { title: new RegExp(search, 'i') },
          { description: new RegExp(search, 'i') },
          { organizer: new RegExp(search, 'i') },
          { venue: new RegExp(search, 'i') }
        ];
      }
  
      // Category filter
      if (category) {
        query.category = category;
      }
  
      // Status filter
      if (status) {
        query.status = status;
      }
  
      // Date range filter
      if (startDate || endDate) {
        query.eventDate = {};
        if (startDate) query.eventDate.$gte = new Date(startDate);
        if (endDate) query.eventDate.$lte = new Date(endDate);
      }
  
      // Organizer filter
      if (organizer) {
        query.organizer = new RegExp(organizer, 'i');
      }
  
      // Dynamic sorting
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
      const olympiads = await Olympiad.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('createdBy', 'name');
  
      const total = await Olympiad.countDocuments(query);
  
      // Get filter options for frontend
      const filterOptions = {
        categories: await Olympiad.distinct('category'),
        organizers: await Olympiad.distinct('organizer'),
        statuses: ['upcoming', 'running', 'closed']
      };
  
      return res.status(200).json({
        success: true,
        message: "Olympiads fetched successfully",
        data: {
          olympiads,
          filterOptions,
          pagination: {
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            totalOlympiads: total,
            limit: parseInt(limit)
          },
          appliedFilters: {
            search,
            category,
            status,
            startDate,
            endDate,
            organizer,
            sortBy,
            sortOrder
          }
        }
      });
    } catch (error) {
      console.error("Get olympiads error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch olympiads"
      });
    }
  };

 

 

export const updateOlympiad = async (req, res) => {
  try {
    const olympiad = await Olympiad.findById(req.params.id);

    if (!olympiad) {
      return res.status(404).json({
        success: false,
        message: "Olympiad not found"
      });
    }

    const updatedOlympiad = await Olympiad.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Olympiad updated successfully",
      data: updatedOlympiad
    });
  } catch (error) {
    console.error("Update olympiad error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update olympiad"
    });
  }
};

export const deleteOlympiad = async (req, res) => {
  try {
    const olympiad = await Olympiad.findById(req.params.id);

    if (!olympiad) {
      return res.status(404).json({
        success: false,
        message: "Olympiad not found"
      });
    }

    await Olympiad.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Olympiad deleted successfully"
    });
  } catch (error) {
    console.error("Delete olympiad error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete olympiad"
    });
  }
};