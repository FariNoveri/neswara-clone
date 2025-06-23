-<?php
require 'vendor/autoload.php';

use Google\Cloud\RecaptchaEnterprise\V1\Client\RecaptchaEnterpriseServiceClient;
use Google\Cloud\RecaptchaEnterprise\V1\Event;
use Google\Cloud\RecaptchaEnterprise\V1\Assessment;
use Google\Cloud\RecaptchaEnterprise\V1\CreateAssessmentRequest;
use Google\Cloud\RecaptchaEnterprise\V1\TokenProperties\InvalidReason;

header('Content-Type: application/json');

function create_assessment(string $recaptchaKey, string $token, string $project, string $action): array {
    try {
        $client = new RecaptchaEnterpriseServiceClient();
        $projectName = $client->projectName($project);

        $event = (new Event())
            ->setSiteKey($recaptchaKey)
            ->setToken($token);

        $assessment = (new Assessment())
            ->setEvent($event);

        $request = (new CreateAssessmentRequest())
            ->setParent($projectName)
            ->setAssessment($assessment);

        $response = $client->createAssessment($request);

        if ($response->getTokenProperties()->getValid() == false) {
            return [
                'success' => false,
                'error' => 'Invalid token: ' . InvalidReason::name($response->getTokenProperties()->getInvalidReason())
            ];
        }

        if ($response->getTokenProperties()->getAction() == $action) {
            return [
                'success' => true,
                'score' => $response->getRiskAnalysis()->getScore()
            ];
        } else {
            return [
                'success' => false,
                'error' => 'Action mismatch'
            ];
        }
    } catch (Exception $e) {
        return [
            'success' => false,
            'error' => 'reCAPTCHA verification failed: ' . $e->getMessage()
        ];
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $token = $data['token'] ?? '';
    $action = $data['action'] ?? '';
    $project = $data['project'] ?? 'neswaraclone';
    $recaptchaKey = $data['recaptchaKey'] ?? '6Lf_FGorAAAAALQ28vlZNKWsiKV_O4lq3-2DZin9';

    if (empty($token) || empty($action)) {
        echo json_encode(['success' => false, 'error' => 'Missing token or action']);
        exit;
    }

    $result = create_assessment($recaptchaKey, $token, $project, $action);
    echo json_encode($result);
} else {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
}
?>