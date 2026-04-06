const router   = require('express').Router();
const ctrl     = require('../controllers/incident.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize }    = require('../middleware/authorize');
const validate = require('../middleware/validateRequest');
const { reportIncidentSchema, resolveIncidentSchema } = require('../validators/incident.validators');
const { PERMISSIONS } = require('../constants/permissions');
const multer = require('multer');
const path = require('path');

// Configure Multer for evidence uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/evidence/'),
  filename: (req, file, cb) => cb(null, `evidence-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

router.use(authenticate);

// List & Get
router.get('/',      authorize(PERMISSIONS.INCIDENT_VIEW), ctrl.list);
router.get('/:id',   authorize(PERMISSIONS.INCIDENT_VIEW), ctrl.getById);

// Report
router.post('/',     authorize(PERMISSIONS.INCIDENT_REPORT), validate(reportIncidentSchema), ctrl.report);

// Investigation entries
router.post('/:id/investigation-entry', authorize(PERMISSIONS.INCIDENT_INVESTIGATE), ctrl.addInvestigationEntry);

// Witness Statements
router.post('/:id/witness-statement', authorize(PERMISSIONS.INCIDENT_WITNESS_SUBMIT), ctrl.captureWitnessStatement);

// CO Acknowledgment
router.post('/:id/co-acknowledge', authorize(PERMISSIONS.INCIDENT_CO_ACKNOWLEDGE), ctrl.acknowledgeStolenReport);

// Evidence Upload
router.post('/:id/evidence', authorize(PERMISSIONS.INCIDENT_INVESTIGATE), upload.single('evidence'), ctrl.uploadEvidence);

// Resolution
router.post('/:id/resolve', authorize(PERMISSIONS.INCIDENT_RESOLVE), validate(resolveIncidentSchema), ctrl.resolve);

module.exports = router;
