pipeline {
  agent any

  environment {
    NODE_ENV = 'test'
    SONAR_HOST_URL = 'https://sonarqube.cicd.kits.ext.educentre.fr'
    SONAR_PROJECT_KEY = 'Examen-tasklist-backend'
    SONAR_PROJECT_NAME = 'Examen-tasklist-backend'
    DOCKERHUB_CREDENTIALS_ID = 'id-dockerhub'
    SONAR_TOKEN_CREDENTIAL_ID = 'id-sonar'
    DOCKERHUB_REPOSITORY = 'kiss04/tasklist-backend-examen'
    IMAGE_TAG = "${env.BUILD_NUMBER}"
  }

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  stages {
    stage('Install Dependencies') {
      steps {
        sh 'npm ci'
        sh 'npx prisma generate'
      }
    }

    stage('Unit Tests') {
      steps {
        sh 'npx prisma generate --schema=prisma/schema-test.prisma'
        sh 'npm run test:coverage'
      }
      post {
        always {
          junit allowEmptyResults: true, testResults: 'reports/junit.xml'
        }
      }
    }

    stage('E2E Tests') {
      steps {
        sh 'npm run test:e2e:coverage'
      }
      post {
        always {
          junit allowEmptyResults: true, testResults: 'reports/junit.xml'
        }
      }
    }

    stage('SonarQube Analysis') {
      steps {
        withSonarQubeEnv('sonarqube-server-1') {
          sh 'npx sonar-scanner'
        }
      }
    }

    stage('Quality Gate') {
      steps {
        timeout(time: 2, unit: 'MINUTES') {
          waitForQualityGate abortPipeline: true
        }
      }
    }

    stage('Docker Build') {
      steps {
        sh '''
          docker buildx create --use --name tasklist-builder || true
          docker buildx build \
            --tag ${DOCKERHUB_REPOSITORY}:${IMAGE_TAG} \
            --tag ${DOCKERHUB_REPOSITORY}:latest \
            --load \
            .
        '''
      }
    }

    stage('Trivy Scan') {
      steps {
        sh 'mkdir -p reports'
        sh '''
          trivy image \
            --format json \
            --output reports/trivy-report.json \
            ${DOCKERHUB_REPOSITORY}:${IMAGE_TAG}
        '''
      }
      post {
        always {
          archiveArtifacts allowEmptyArchive: true, artifacts: 'reports/trivy-report.*'
        }
      }
    }

    stage('Generate SBOM') {
      steps {
        sh '''
          trivy image \
            --format spdx-json \
            --output reports/sbom-spdx.json \
            ${DOCKERHUB_REPOSITORY}:${IMAGE_TAG}

          trivy image \
            --format cyclonedx \
            --output reports/sbom-cyclonedx.json \
            ${DOCKERHUB_REPOSITORY}:${IMAGE_TAG}
        '''
      }
      post {
        always {
          archiveArtifacts allowEmptyArchive: true, artifacts: 'reports/sbom-*'
        }
      }
    }

    stage('Docker Push') {
      when {
        branch 'main'
      }
      steps {
        withCredentials([usernamePassword(credentialsId: env.DOCKERHUB_CREDENTIALS_ID, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
          sh '''
            echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
            docker buildx build \
              --platform linux/amd64 \
              --tag ${DOCKERHUB_REPOSITORY}:${IMAGE_TAG} \
              --tag ${DOCKERHUB_REPOSITORY}:latest \
              --sbom=true \
              --provenance=true \
              --push \
              .
          '''
        }
      }
      post {
        always {
          sh 'docker logout'
        }
      }
    }
  }

  post {
    always {
      cleanWs()
    }
    success {
      echo 'Backend pipeline completed successfully!'
    }
    failure {
      echo 'Backend pipeline failed!'
    }
  }
}